""" A class to retrieve Github folders / files
"""
# dataclasses requires python 3.7
from dataclasses import dataclass
# importlib.metadata requires python 3.8
from importlib.metadata import version
import json
from pathlib import Path
import shutil
from urllib.parse import urlparse
import urllib3
# app modules
from distrobuilder_menu import utils
# app classes
from distrobuilder_menu.api.singleton import SingletonThreadSafe
from distrobuilder_menu.config.user import Settings

class Gethub(SingletonThreadSafe):
    """ Another singleton class to ensure Github API calls are made
        efficiently using urllib3 Connection Pooling (as most folder
        downloads will probably be unauthenticated)
    """
    def __init__(self):

        # fix pylint 'super-init-not-called'
        super().__init__()

        # read user settings (Settings is also a singleton)
        user_config = Settings.instance()

        # construct api endpoints
        self.api = self.Api(base_url=user_config.gh_api_url,
                            owner=user_config.gh_owner,
                            repo=user_config.gh_repo
                           )
        # add Access Token if configured
        self.token = user_config.github_token

        if self.token:
            # f-strings don't work here
            self.headers = {'Accept': 'application/vnd.github+json',
                            'Authorization': ' '.join(['token', self.token]) }
        else:
            self.headers = {'Accept': 'application/vnd.github+json'}

        # create HTTP session pool
        self.http = urllib3.PoolManager()


    @dataclass
    class Api:
        """ Constructs Github API useful public paths
        """
        # pylint: disable=too-many-instance-attributes
        base_url: str
        owner: str
        repo: str

        def __post_init__(self):
            if all([self.base_url, self.owner, self.repo]):
                self.repos = f"{self.base_url}/repos/{self.owner}/{self.repo}"
                self.comments = f"{self.repos}/issues/comments"
                self.commits = f"{self.repos}/commits"
                self.contents = f"{self.repos}/contents"
                self.pulls = f"{self.repos}/pulls"
                self.releases = f"{self.repos}/releases"
                # fixed endpoints
                self.ratelimit = f"{self.base_url}/rate_limit"
            else:
                print("Error constructing Gethub API endpoints:\n")
                utils.die(1, f"base_url={self.base_url} owner={self.owner} repo={self.repo}")


    # https://stackoverflow.com/a/17626704/555451
    def call_the_api(self, http_type, url, data_type='json', json_headers=True, debug=False):
        """ Dedicated function for HTTP error handling in a single place.
            Returns either a decoded JSON data object or a binary download
            Nowadays urllib3 by default has set in responses 'auto_close': True
            (so no need to manually close the connection as still shown in the docs)
        """
        # pylint: disable=too-many-arguments
        if debug:
            print(f"\nDEBUG: call_the_api()\n\n {http_type} {self.headers}\n {url}\n")

        if data_type == 'json':
            print(f"\nQuerying the API: {url}")

        try:
            # validate the url (prevents a chain of errors)
            if self.check_url(url):

                if data_type == 'json':
                    if json_headers:
                        response = self.http.request(http_type, url, headers=self.headers)
                    else:
                        # no headers sent for Aurweb HTTP queries
                        response = self.http.request(http_type, url)
                    try:
                        data = json.loads(response.data)
                        # Github API returns messages not HTTP errors on invalid urls
                        if 'message' in data:
                            utils.die(1, f"Error: {data['message']} {http_type} {url}")
                    except json.decoder.JSONDecodeError:
                        utils.die(1, 'Error in query: no JSON Data was returned')
                else:
                    # no headers sent for downloads
                    # 'preload_content = False' is recommended for downloading large files
                    data = self.http.request(http_type, url, preload_content=False)
            else:
                # bad url given
                utils.die(1, f"Error: malformed url: {url}")

        # rarely reached as the Github API returns 'message' key on errors
        # HTTPError is the Base exception for urllib3 so should catch everything
        except urllib3.exceptions.NewConnectionError as err:
            utils.die(1, f"Connection Error: {err.args[1]}")
        except urllib3.exceptions.HTTPError as err:
            utils.die(1, f"HTTP error:' {err.args[1]}")

        return data


    def check_rate_limit(self):
        """ Queries the Github Rate Limit API & prints current limits
            NB: 'rate' key is being deprecated in favor of 'core'
        """
        data = self.call_the_api('GET', self.api.ratelimit)
        print(data['resources']['core'])


    def check_file_list(self, url):
        """ Extracts just the data we need from Github's API JSON & returns
            a list of dicts with only keys: name / size / download_url
            called by update_templates() but can be used by anything.
        """
        data = self.call_the_api('GET', url)
        file_list = []

        for link in data:
            file_dict = {}
            file_dict['name'] = link['name']
            file_dict['size'] = link['size']
            file_dict['download_url'] = link['download_url']

            file_list.append(file_dict)

        return file_list


    def check_url(self, url):
        """ convenience function for validating URL's
            used by call_the_api() to prevent a cascade of errors
        """
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except ValueError:
            return False


    def check_latest_release(self):
        """ Queries the Github API for the latest dbmenu release
        """
        # see importlib.metadata (python 3.8+)
        app_version = version('distrobuilder-menu')
        print(f"Distrobuilder Menu: {app_version}")

        # read user settings (Settings is also a singleton)
        user_config = Settings.instance()

        # construct api paths
        api = self.Api(base_url=user_config.gh_api_url,
                       owner='itoffshore',
                       repo='distrobuilder-menu'
                      )
        data = self.call_the_api('GET', f"{api.releases}/latest")
        name = data['name']
        tag_name = data['tag_name']
        published_at = data['published_at']

        if tag_name == app_version:
            print(f"\n* dbmenu is the latest version: {tag_name}")
        else:
            print(f"\ndbmenu can be updated from {app_version} => {tag_name}")
            print(f"\n* Release: {name}\n* Published: {published_at}")

            # check for AUR install
            if not self.check_aur():
                # run pipx || pip to update
                utils.update_dbmenu(tag_name)


    def check_aur(self):
        """ Reuses call_the_api() to query Aurweb for the latest app version

        Returns:
            boolean: whether a pacman pkg is installed in Arch Linux
        """
        archlinux_check = 'pacman --query distrobuilder-menu'
        url = 'https://aur.archlinux.org/rpc/v5/info?arg[]=distrobuilder-menu'

        if utils.check_command(archlinux_check):
            archlinux_check = True
            data = self.call_the_api('GET', url, json_headers=False)

            # Aurweb returns a list of dicts
            arch_version = data['results'][0]['Version']
            print(f"\nLatest version in Arch Linux: {arch_version}")
        else:
            archlinux_check = False

        return archlinux_check


    def download_files(self, file_dict):
        """ As input takes a list of dicts with keys: 'url' / 'file' as the
            source & destination of file downloads. Input is generated by
            update_templates() in the main application.
        """
        for item in file_dict:
            url = item['url']
            file = item['file']

            print(f"\nDownloading:\n {url}")

            # check destination folder exists
            dest_dir = Path(file).parent

            if not dest_dir.is_dir():
                choice = utils.get_input(f"\nCreate destination ? : {dest_dir} [Y/n] ",
                                            accept_empty=True, default='Y'
                                        )
                # create destination
                if choice.startswith('y') or choice.startswith('Y'):
                    try:
                        dest_dir.mkdir(parents=True)
                    # cross platform & also catches permission errors
                    except (OSError, IOError) as err:
                        utils.die(1, f"Error: {err.args[1]} : {dest_dir}")
                else:
                    utils.die(1, f"Cancelled download of: {file}\n")

            # download the file
            with open(file, 'wb') as out_file:
                response = self.call_the_api('GET', url, data_type = 'binary')
                shutil.copyfileobj(response, out_file)
                print(f" Saved to: ==> {file}")
