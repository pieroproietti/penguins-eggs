""" A class to store argparse settings & share command line options
    between modules (& avoid cyclic-import errors in pylint)
"""
import argparse
from distrobuilder_menu.api.singleton import SingletonThreadSafe

class AppConfig(SingletonThreadSafe):
    """ Singleton class to store argparse options

    Returns:
        dict: with argparse options
    """

    # setattr causes pylint false postives
    #
    # pylint: disable=no-member

    def __init__(self, app_args=None):

        app_args = vars(get_args())

        for key, value in app_args.items():
            setattr(self, key, value)

        if self.lxc:
            self.lxd = False

    def get(self):
        """ class method to return the argparse settings
            (& avoid pylint 'too-few-public-methods')

        Returns:
            dict: with argparse settings
        """
        return self


# class methods cannot see argv / argparse
def get_args(argv=None):
    """ Read command line args
        by default lxd containers are built.
    """
    parser = argparse.ArgumentParser(
        description="Menu driven LXD / LXC images for Distrobuilder",
        prog="dbmenu")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--lxd", default=True,
                       action="store_true",
                       help="build LXD container / vm image (default)")
    group.add_argument("--lxc",
                       action="store_true",
                       help="build LXC container image")
    group.add_argument("-o", "--override",
                       action="store_true",
                       help="create new template override")
    group.add_argument("-g", "--generate",
                       action="store_true",
                       help="generate custom template from override")
    group.add_argument("-i", "--init",
                       action="store_true",
                       help="create / edit cloud-init configuration")
    group.add_argument("-c", "--copy",
                       action="store_true",
                       help="copy existing template / override")
    group.add_argument("-e", "--edit",
                       action="store_true",
                       help="edit existing template / override")
    group.add_argument("-d", "--delete",
                       action="store_true",
                       help="delete template / override")
    group.add_argument("-m", "--move",
                       action="store_true",
                       help="move / rename template or override")
    group.add_argument("-y", "--merge",
                       action="store_true",
                       help="merge cloudinit configuration with yq")
    group.add_argument("-u", "--update",
                       action="store_true",
                       help="force update templates (default auto weekly)")
    parser.add_argument("-s", "--show", default=False,
                        action="store_true",
                        help="show configuration settings")
    parser.add_argument("-t", "--timer", default=False,
                        action="store_true",
                        help="debug timer used in testing")
    parser.add_argument("--rate", default=False,
                        action="store_true",
                        help="show current Github API Rate Limit")
    parser.add_argument("--reset", default=False,
                        action="store_true",
                        help="reset dbmenu base directory configuration")
    parser.add_argument("-r", "--regenerate", default=False,
                        action="store_true",
                        help="regenerate custom templates")
    parser.add_argument("-v", "--version", default=False,
                        action="store_true",
                        help="show dbmenu version / update to latest release")

    return parser.parse_args(argv)
