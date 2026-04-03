""" Cloud-init functions to manipulate YAML
"""
from pathlib import Path
# app modules
from distrobuilder_menu.menus import shared
from distrobuilder_menu import utils
# app classes
from distrobuilder_menu.menus.menuclass import Menu
from distrobuilder_menu.config.user import Settings

# globals
# singleton class shares user config between modules
USER_CONFIG = Settings.instance()

def merge_cloudinit(src_template=None, edit=True, update_footer=True):
    """ Merges a cloud-init yaml template into a custom template via
        utils.yaml_add_content()

    Args:
        src_template (str, optional): path to source template. Defaults to None.
    """
    cloudinit_type = select_cloudinit_type('Merge')

    # return to main event loop
    if cloudinit_type == 'user_quit':
        return 'user_quit'

    cloudinit_file = select_cloudinit_file(cloudinit_type)

    # return to main event loop
    if cloudinit_file == 'user_quit':
        return 'user_quit'

    node_section = cloudinit_type.split('/')[1]

    if not src_template:
        title = "Merge cloud-init configuration:"
        custom_question = "Choose SOURCE template to modify ? "
        src_template = shared.select_src_template(title, custom_question)[1]

    # return to main event loop
    if src_template == 'user_quit':
        return 'user_quit'

    # merge cloudinit content with yq
    print(f"\nMerge cloud-init: {cloudinit_file}")
    print(f"================> {src_template}")

    choice = utils.get_input('\nMerge cloud-init configuration [Y/n]: ? ',
                             accept_empty=True, default='Y'
                            )
    if choice.startswith('y') or choice.startswith('Y'):
        utils.yaml_add_content(src_file=src_template, node='files', search_key='name',
                               search_value=node_section, merge_file=cloudinit_file,
                               new_key='content'
                              )
        # tidy up template
        utils.format_template(src_template)

        # optionally update dbmenu footer (during ad hoc cloudinit config merges)
        if update_footer:
            utils.update_footer(src_template, 'cloudinit', cloudinit_file, subkey=node_section)

        # optionally edit
        if edit:
            question = 'Edit merged template [Y/n]: ? '
            utils.edit_file(src_template, USER_CONFIG.console_editor, question=question)

    # used for template footer
    return cloudinit_file


def create_cloudinit(cloudinit_type=None, cloudinit_name=None):
    """ Display questions for creating a cloud-init template
        & optionally edits the file

    Args:
        cloudinit_type (str, optional): e.g user || network || vendor. Defaults to None.
        cloudinit_name (str, optional): name of the yaml file. Defaults to None.

    Returns:
        str: created file's path (not currently used)
    """
    # choose template (if not passed in as an arg)
    if not cloudinit_type:
        cloudinit_type = select_cloudinit_type('Create')

        if cloudinit_type == 'user_quit':
            return cloudinit_type

    if not cloudinit_name:
        prompt = f"Enter {cloudinit_type} filename ? (empty returns to main menu) "
        cloudinit_name = utils.get_input(prompt, accept_empty=True)

    # return to main event loop
    if cloudinit_name == "N":
        return 'user_quit'

    # construct paths
    cloudinit_subdir = f"{USER_CONFIG.main_dir}/{cloudinit_type}"
    cloudinit_file = f"{cloudinit_subdir}/{cloudinit_name}.yaml"

    try:
        # formatting
        print('')

        # create subdir
        if not Path(cloudinit_subdir).is_dir():
            print(f"Creating: {cloudinit_subdir}")
            Path(cloudinit_subdir).mkdir(parents=True)

        # create config
        if not Path(cloudinit_file).exists():
            write_cloudinit(cloudinit_file)
        else:
            print(f"WARN: not overwriting: {cloudinit_file} - remove & re-generate it")

        # formatting
        print('')

    except OSError as err:
        utils.die(1, f"Error: cloud-init creation failed: {err.args[1]}")

    # edit cloudinit file
    question = 'Edit cloud-init [Y/n]: ? '
    utils.edit_file(cloudinit_file, USER_CONFIG.console_editor, question=question)
    return cloudinit_file


def write_cloudinit(file):
    """ Writes to file a minimal cloud-init configuration

    Args:
        file (str): the file path
    """
    if USER_CONFIG.cloudinit_user_dir in file:
        cloudinit = {}
        cloudinit['version'] = 'v1'
        cloudinit['packages_update'] = True
        cloudinit['packages_upgrade'] = True
    else:
        cloudinit = '# no defaults for network / vendor data'

    utils.write_config(file, cloudinit)
    utils.preprend_lines(file, '#cloud-config')


def select_cloudinit_type(action):
    """ Used when creating & merging cloud-init configuration &
        displays a menu for choosing cloud-init types (user / network / vendor)

    Args:
        action (str): used in generated menu (e.g: Merge / Create)

    Returns:
        str: selected cloud-init type
    """
    cloudinit_paths = USER_CONFIG.get_cloudinit_paths()
    menu_options = [cloudinit_paths['user'], cloudinit_paths['network'], cloudinit_paths['vendor']]

    title = f"{action} cloud-init config"
    question = "Choose cloud-init type (subdirectory) ?"

    menu = Menu(title, question, menu_options, 'both')
    choice_index = menu.get_choice()

    # return to main event loop
    if choice_index == 'user_quit':
        return choice_index

    cloudinit_type = menu_options[choice_index]
    return cloudinit_type


def get_cloudinit_type(cloudinit_path):
    """ Convenience function to return the cloudinit config type

    Args:
        cloudinit_path (str): cloudinit file path

    Returns:
        str: user || network || vendor
    """
    if USER_CONFIG.cloudinit_user_dir in cloudinit_path:
        cloudinit_type = 'user-data'
    elif USER_CONFIG.cloudinit_network_dir in cloudinit_path:
        cloudinit_type = 'network-data'
    else:
        cloudinit_type = 'vendor-data'
    return cloudinit_type


def select_cloudinit_file(cloudinit_type):
    """ Displays a menu for selecting a cloud-init file

    Args:
        cloudinit_type (str): user || network || vendor

    Returns:
        str: absolute path of the selected file
    """
    cloudinit_subdir = f"{USER_CONFIG.main_dir}/{cloudinit_type}"

    # find_files returns a dict of os (from the filename) : template_path
    cloudinit_files = utils.find_files('*.yaml', cloudinit_subdir)
    title = f"Select config from {cloudinit_type}:"
    question = "Choose cloud-init file ?"

    # display menu
    menu = Menu(title, question, cloudinit_files, 'keys')
    file_path = menu.get_choice()['value']
    return file_path
