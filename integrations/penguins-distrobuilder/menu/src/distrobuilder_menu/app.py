#!/usr/bin/env python3

""" App entrypoint module

    calls the default menu unless one of the 2nd level menu options
    are called via command line options
"""
# custom modules
from distrobuilder_menu.menus import cloudinit
from distrobuilder_menu.menus import common
from distrobuilder_menu import templates
from distrobuilder_menu import utils
# custom classes
from distrobuilder_menu.api.gethub import Gethub
from distrobuilder_menu.config.app import AppConfig
from distrobuilder_menu.config.user import Settings

# globals (singleton classes)
# shares user config between modules
USER_CONFIG = Settings.instance()
# read command line
ARGS = AppConfig.instance().get()
# Github API methods
GETHUB = Gethub.instance()

def main():
    """ The main() method
        processes command line options (many are mutually exclusive except -t option).
    """
    # pylint: disable=too-many-branches
    # -u menu option
    if ARGS.update:
        # also runs process_data() / load_json_cache() & update_templates()
        templates.update_lxd_json()

    # --rate menu option
    if ARGS.rate:
        GETHUB.check_rate_limit()

    # --reset menu option
    if ARGS.reset:
        USER_CONFIG.setup_config()

    # -o menu option
    if ARGS.override:
        common.create_custom_override()

    # -g menu option
    if ARGS.generate:
        common.generate_custom_template()

    # -c menu option
    if ARGS.copy:
        common.menu_copy()

    # -e menu option
    if ARGS.edit:
        common.menu_edit()

    # -r menu option
    if ARGS.delete:
        common.menu_delete()

    # -m menu option
    if ARGS.move:
        common.menu_rename()

    # -i menu option
    if ARGS.init:
        cloudinit.create_cloudinit()
        utils.die(0)

    # -s menu option
    if ARGS.show:
        templates.get_user_config()

    # -y menu option
    if ARGS.merge:
        cloudinit.merge_cloudinit()

    # --regen menu option
    if ARGS.regenerate:
        base_list, custom_list = templates.create_custom_lists()
        templates.regenerate_template(base_list)
        templates.regenerate_template(custom_list)

    # -v menu option
    if ARGS.version:
        GETHUB.check_latest_release()

    # by default show the main menu & also show it after individual options run
    common.menu_default()


# Start #
if __name__ == "__main__":
    main()
