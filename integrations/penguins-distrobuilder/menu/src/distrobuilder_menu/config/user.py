""" A singleton class to store global configuration for sharing between modules
"""
# dataclasses requires python 3.7
from dataclasses import dataclass
from pathlib import Path
from pprint import pprint
# app modules
from distrobuilder_menu import utils
# app classes
from distrobuilder_menu.api.singleton import SingletonThreadSafe

class Settings(SingletonThreadSafe):
    """ A singleton class used to store User Config settings.
    """
    # disable for dynamically generated attributes
    # pylint: disable=no-member

    def __init__(self):
        """ To deal with possible missing values in user configuration here we
            first read values from the 'Default' subclass & subsequently overwrite
            them with the values from YAML. On average takes 0.0003 seconds.
        """
        # fix pyint 'super-init-not-called'
        super().__init__()

        # set default values
        self.set_defaults()

        # override defaults with values from yaml
        if Path(self.dbmenu_config).is_file():
            config = utils.read_config(self.dbmenu_config, False)

            if config:
                # read a dict into class attributes
                for key, value in config.items():
                    setattr(self, key, value)
            else:
                print(f"WARN: config file is empty: {self.dbmenu_config}")
        else:
            # new installs & --reset option
            print(f"Running initial setup to generate: {self.dbmenu_config}")
            self.setup_config()


    def set_defaults(self):
        """ sets default application values from the 'Default' dataclass
        """
        # disable for dynamically generated attributes
        # pylint: disable=no-member

        # read dataclass into object
        for name, field in self.Default.__dataclass_fields__.items():
            setattr(self, name, field.default)


    def setup_config(self):
        """ Normally only run once for new installations. Resets the default base
            directory from ~/distrobuilder & optionally creates the User Config file
            ~/.config/dbmenu.yaml
        """
        # choose default directory
        print(f"Default dbmenu directory is currently: {self.main_dir}")
        choice = utils.get_input('\nChange dbmenu dir [y/N]: ? ', accept_empty=True)

        if choice.startswith('y') or choice.startswith('Y'):
            dir_choice = utils.get_input('Enter new path: ? ', regexp='^/[a-zA-Z]+')

            # reset dataclass vars
            if Path(dir_choice).is_absolute():
                self.Default.reset(self, dir_choice)
                # display User Config settings
                # accessing the __dict__ attribute is faster than vars()
                # https://www.pythondoeswhat.com/2012/01/dict-and-vars.html
                print('')
                pprint(self.__dict__)
                print('')
            else:
                utils.die(1, f"Error: not a directory path: {dir_choice}")

            # create config file
            # pass dict representation of the class (so yaml is written correctly)
            utils.write_config(self.dbmenu_config, self.__dict__)
            self.edit_config(question='\nEdit new configuration [Y/n]: ? ')


    @dataclass
    class Default:
        """ Stores default values for the app.
            Called by base class: 'Settings'
        """
        # pylint: disable=too-many-instance-attributes

        config_dir: str = f"{Path.home()}/.config"
        main_dir: str = f"{Path.home()}/distrobuilder"
        target_dir: str = f"{main_dir}/build"
        files_dir: str = f"{main_dir}/files"
        template_dir: str = f"{main_dir}/templates"
        cloudinit_dir: str = f"{main_dir}/cloudinit"
        dbmenu_config: str = f"{config_dir}/dbmenu.yaml"

        gh_owner: str = 'lxc'
        gh_repo: str = 'lxc-ci'
        gh_api_url: str = 'https://api.github.com'
        github_token: str = ''

        cache_dir: bool = False
        cleanup: bool = True
        compression: str = 'xz'
        console_editor: str = 'nano'
        debug: bool = False
        disable_overlay: bool = False
        import_into_lxd: bool = True

        json_cachefile: str = f"{template_dir}/cache.json"
        lxd_json: str = f"{template_dir}/lxd.json"
        lxd_output_type: str = 'unified'
        subdir_custom: str = f"{template_dir}/custom"
        subdir_images: str = f"{template_dir}/images"
        subdir_overrides: str = f"{template_dir}/overrides"
        cloudinit_network_dir: str = f"{cloudinit_dir}/network-data"
        cloudinit_user_dir: str = f"{cloudinit_dir}/user-data"
        cloudinit_vendor_dir: str = f"{cloudinit_dir}/vendor-data"
        timeout: bool = False
        yq_check: bool = True

        def reset(self, new_dir):
            """ Reinitialises directory vars if a new base directory is chosen in setup_config()
                (typically this is run only once on first install when ~/.config/dbmenu.yaml
                is not found & is optionally generated)
            """
            self.main_dir: str = new_dir
            self.target_dir: str = f"{new_dir}/build"
            self.files_dir: str = f"{new_dir}/files"
            self.template_dir: str = f"{new_dir}/templates"
            self.cloudinit_dir: str = f"{new_dir}/cloudinit"

            # subdirs & files
            self.json_cachefile: str = f"{self.template_dir}/cache.json"
            self.lxd_json: str = f"{self.template_dir}/lxd.json"
            self.subdir_custom: str = f"{self.template_dir}/custom"
            self.subdir_images: str = f"{self.template_dir}/images"
            self.subdir_overrides: str = f"{self.template_dir}/overrides"
            self.cloudinit_user_dir: str = f"{self.cloudinit_dir}/user-data"
            self.cloudinit_network_dir: str = f"{self.cloudinit_dir}/network-data"
            self.cloudinit_vendor_dir: str = f"{self.cloudinit_dir}/vendor-data"

    def edit_config(self, question=None):
        """ Edits User Config YAML via edit_file in utils class
            Called here during __init__ for new installations & from main()
        """
        if question:
            # only ask about editing User Config on first setup & show settings
            utils.edit_file(self.dbmenu_config, self.console_editor, question=question)
        else:
            # menu functions edit User Config immediately
            utils.edit_file(self.dbmenu_config, self.console_editor)

        utils.die(0, '\nRun dbmenu again to use the new configuration.')


    def get_cloudinit_paths(self):
        """ Reads the cloud-init paths from User Configuration

        Returns:
            dict: cloud-init paths for user / network / vendor
        """
        cloudinit_paths = {}

        # removeprefix requires python 3.9+
        cloudinit_user_path = self.cloudinit_user_dir.removeprefix(
            f"{self.main_dir}/"
            )
        cloudinit_network_path = self.cloudinit_network_dir.removeprefix(
            f"{self.main_dir}/"
            )
        cloudinit_vendor_path = self.cloudinit_vendor_dir.removeprefix(
            f"{self.main_dir}/"
            )
        cloudinit_paths['user'] = cloudinit_user_path
        cloudinit_paths['network'] = cloudinit_network_path
        cloudinit_paths['vendor'] = cloudinit_vendor_path

        return cloudinit_paths
