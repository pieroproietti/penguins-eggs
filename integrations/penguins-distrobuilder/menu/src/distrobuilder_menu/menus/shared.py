""" Menu functions shared with modules: cloudinit / common
"""
# app classes
from distrobuilder_menu.config.app import AppConfig
from distrobuilder_menu.config.user import Settings
from distrobuilder_menu.menus.menuclass import Menu
# app modules
from distrobuilder_menu.menus import helpers
from distrobuilder_menu import templates
from distrobuilder_menu import utils

# singleton classes shares config between modules
USER_CONFIG = Settings.instance()
# read command line
ARGS = AppConfig.instance().get()
DEBUG_TIMER = utils.Timer(ARGS.timer)

def select_src_template(title, custom_question):
    """ Returns the source template os name
        used by merge_cloudinit() & generate_custom_template()

    Args:
        title (str): menu title
        custom_question (str): menu question
    Returns:
        str: template name (e.g ubuntu)
    """
    question = "Select SOURCE template directory ?"
    menu_options = ['Standard Templates', 'Custom Templates']

    # SOURCE Template
    template_dir = menu_multi(title, question, menu_options)

    # return to main event loop
    if template_dir == 'user_quit':
        # 2 x objects are expected to be returned
        return template_dir, template_dir

    template_files = utils.find_files('*.yaml', template_dir)

    # menu_templates() returns a tuple: os_name, template_path
    os_name, src_template = menu_templates(template_files, template_dir, 'select', custom_question)
    return os_name, src_template


def menu_multi(title, question, menu_opts):
    """ displays multiple choices for copy / edit / remove menus
        pass in options as menu_opts[] for the menu choices
    """
    cloudinit_dict = USER_CONFIG.get_cloudinit_paths()

    # alternative to long if / elseif - easier to read & add to
    option_dict = {
        'Standard Templates': USER_CONFIG.subdir_images,
        'Custom Templates': USER_CONFIG.subdir_custom,
        'Custom Overrides': USER_CONFIG.subdir_overrides,
        'User Configuration': USER_CONFIG.dbmenu_config,
        cloudinit_dict['user']: USER_CONFIG.cloudinit_user_dir,
        cloudinit_dict['network']: USER_CONFIG.cloudinit_network_dir,
        cloudinit_dict['vendor']: USER_CONFIG.cloudinit_vendor_dir
    }

    line_dict = {}

    for key in menu_opts:
        if key in option_dict:
            line_dict[key] = option_dict[key]

    # generate menu (see class menus.py)
    # get_choice() returns a dict with 2 x keys of key / value
    menu = Menu(title, question, line_dict, 'both')
    file_path = menu.get_choice()['value']

    return file_path


def menu_templates(template_dict, template_dir, action, custom_question=None):
    """ Displays the 2nd menu with distribution template / override choices.
        NB: Menu class accepts lists & dicts as data
    """
    # speedtest
    DEBUG_TIMER.start()

    # sanity checks
    if len(template_dict) == 0:

        if template_dir == USER_CONFIG.subdir_images:
            # new installs lack templates & json cache
            # queries LXD images: server weekly for updates
            templates.load_json_cache()

            # users may cancel the initial template download so run again here
            template_files = utils.find_files('*.yaml', template_dir)
            if len(template_files) == 0:
                # queries the Github API for updates
                templates.update_templates()
        else:
            utils.die(1, f"Error: no custom templates found in: {template_dir}")

    # container_type only relevant when building templates
    if template_dir in (USER_CONFIG.subdir_custom, USER_CONFIG.subdir_images):
        # ARGS.lxd is usually true so check lxc
        if ARGS.lxc:
            container_type = 'LXC'
        else:
            container_type = 'LXD'

        pre_str = f"Choose {container_type}"
    else:
        pre_str = 'Choose'

    # generate menu title & question
    menu_context = helpers.get_menu_context(template_dir, pre_str, action)
    title = menu_context['title']

    # construct question
    if not custom_question:
        question = menu_context['question']
    else:
        question = custom_question

    # generate menu (see menus.py)
    menu = Menu(title, question, template_dict, 'keys')

    # speedtest
    DEBUG_TIMER.stop(newline=True)

    # display menu: get_choice() returns a dict with 2 x keys of key / value
    choice_dict = menu.get_choice()

    os_name = choice_dict['key']
    template_path = choice_dict['value']

    # return multiple values (tuple)
    return os_name, template_path
