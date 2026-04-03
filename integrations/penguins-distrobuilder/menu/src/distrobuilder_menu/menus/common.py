""" Top level menus
"""
from pathlib import Path
# app modules
from distrobuilder_menu import builder
from distrobuilder_menu import templates
from distrobuilder_menu import utils
from distrobuilder_menu.menus import cloudinit
from distrobuilder_menu.menus import helpers
from distrobuilder_menu.menus import shared
# app classes
from distrobuilder_menu.menus.menuclass import Menu
from distrobuilder_menu.config.app import AppConfig
from distrobuilder_menu.config.user import Settings

# singleton classes share config between modules
USER_CONFIG = Settings.instance()

# read command line
ARGS = AppConfig.instance().get()
DEBUG_TIMER = utils.Timer(ARGS.timer)

# main event loop
def menu_default():
    """ Displays the initial menu with the various options
    """
    if ARGS.lxd:
        container_type = "LXD"
    else:
        container_type = "LXC"

    title = f"Distrobuilder Menu ({container_type})"
    question = 'Please choose an option'
    menu_options = ['Build image', 'Create Custom Override',
                    'Create cloud-init Config', 'Generate Custom Template',
                    'Merge cloud-init Config', 'Copy Template / Config',
                    'Edit Template / Config', 'Delete Template / Config',
                    'Rename Template / Config', 'Update Templates',
                    'Show User Configuration']
    while True:
        # generate menu (see class menus.py)
        # get_choice() returns an int for list data[])
        choice_opt = {}
        menu = Menu(title, question, menu_options, 'both')
        choice_opt = str(menu.get_choice())

        # all other instances of get_choice() receiving empty user input
        # return to the calling function so finally exit the main event loop here.
        if choice_opt == 'user_quit':
            utils.die(0, '\nQuitting Distrobuilder Menu.\n')

        # alternative to if elif
        {
            '0': menu_build,
            '1': create_custom_override,
            '2': cloudinit.create_cloudinit,
            '3': generate_custom_template,
            '4': cloudinit.merge_cloudinit,
            '5': menu_copy,
            '6': menu_edit,
            '7': menu_delete,
            '8': menu_rename,
            '9': templates.update_lxd_json,
            '10': templates.get_user_config
        }[choice_opt]()


def menu_versions(template, version_list, template_path):
    """ Displays the 3rd menu with distribution version choices.

        Custom template names do not match OS names in JSON. Here the 'distribution' value
        in the template YAML acts as a fingerprint to identify the os of custom templates
        with find_os() & get_distribution().

        Returns: [for the chosen option]
        dict: 'arch_top_level' 'type_top_level' 'os' 'type' 'arch' 'release' 'variant'
    """
    DEBUG_TIMER.start()

    # initialize multiple lists
    os_list, menu_list = [], []
    real_os = helpers.find_os(template_path)

    # filter versions by os choice & virtualization
    # version_list is slimmed down JSON data with only the info we need
    for item in version_list:

        if item['os'] == real_os:
            # vm's are LXD only
            if ARGS.lxc and item['type_top_level'] == 'virtual-machine':
                pass
            else:
                os_list.append(item)
                menu_list.append(
                    f"{real_os} {item['release']} {item['variant']} {item['type_top_level']}"
                    )

    # sanity checks
    if len(menu_list) == 0:
        client = utils.get_lxd_binary()

        if client == 'lxc':
            utils.die(1, f"\n{template} will only build with incus")
        else:
            utils.die(1, 'logic bug in menu_versions()')

    # ARGS.lxd is usually true so check lxc
    if ARGS.lxc:
        container_type = 'LXC'
    else:
        container_type = 'LXD'

    # get_menu_context() is for directory type menus
    # there is only one instance of this file type menu so construct title / question
    title = f"Build {container_type} Variant"
    template_type = helpers.get_template_type(template_path)
    question = f"Build {container_type} variant from {template_type} template: {template}"

    # generate menu (see menus.py)
    # get_choice() returns a list index here
    menu = Menu(title, question, menu_list)
    DEBUG_TIMER.stop()
    choice_index = menu.get_choice()

    # return to main event loop
    if choice_index == 'user_quit':
        return choice_index

    # dictionary with build options
    return os_list[choice_index]


def menu_override():
    """ Displays the menu to select custom override.
    """
    override_dir = USER_CONFIG.subdir_overrides
    override_files = utils.find_files('*.yaml', override_dir)

    # sanity checks
    if len(override_files) == 0:
        input(f"\nError: no custom overrides found in:\n\n{override_dir}\n")
        return ('user_quit', 'user_quit')

    # generate menu (see menus.py)
    # a stem is the filename without the extension (a pathlib attribute)
    file_stem, file_path = shared.menu_templates(override_files, override_dir, 'merge')
    return file_stem, file_path


def menu_rename():
    """ Displays the menu to choose template / override to rename.
    """
    title = "Rename Template / Override"
    question = "Choose template or override directory ? : "
    cloudinit_paths = USER_CONFIG.get_cloudinit_paths()

    # SOURCE Template
    menu_options = ['Standard Templates', 'Custom Templates', 'Custom Overrides',
                    cloudinit_paths['user'], cloudinit_paths['network'], cloudinit_paths['vendor']]
    template_dir = shared.menu_multi(title, question, menu_options)

    # return to main event loop
    if template_dir == 'user_quit':
        return

    # change menu context based on type
    # returns a dict with keys 'menu' / 'title' / 'template_type'
    menu_context = helpers.get_menu_context(template_dir, 'Choose', 'rename')

    # infinite loop for renaming multiple files
    while True:
        template_files = utils.find_files('*.yaml', template_dir)

        # generate menu context
        menu_context = helpers.get_menu_context(template_dir, 'Choose', 'rename')

        # sanity checks
        if len(template_files) == 0:
            utils.die(1, f"Error: no {menu_context['template_type']} found in {template_dir}")

        # generate 2nd menu (see menus.py)
        # Menu can display 'keys' (filename) or 'value' (file path) or 'both'
        menu = Menu(menu_context['title'], menu_context['question'], template_files, 'keys')
        # get_choice() returns a dict with 2 x keys ('key' / 'value')
        choice = menu.get_choice()
        file_path = choice['value']
        file_name = choice['key']

        # return to main event loop
        if file_path == 'user_quit':
            return

        # get new filename
        prompt = f"Rename {file_name} => ? (empty returns to main menu) : "
        new_name = utils.get_input(prompt, accept_empty=True)

        # return to main event loop
        if new_name == 'N':
            return

        # add '.yaml' extension for new files
        if Path(file_path).is_file():
            if new_name.endswith('.yaml'):
                new_path = f"{template_dir}/{new_name}"
            else:
                new_path = f"{template_dir}/{new_name}.yaml"
        else:
            # directories
            new_path = f"{template_dir}/{new_name}"

        # move / rename file
        utils.move_file(file_path, new_path)


def menu_edit():
    """ Displays the edit menu to choose configuration or template to edit.
    """
    title = "Edit Templates / Configuration"
    question = "Choose Template or Configuration to edit ? : "
    cloudinit_paths = USER_CONFIG.get_cloudinit_paths()

    menu_options = ['Standard Templates', 'Custom Templates',
                    'Custom Overrides', cloudinit_paths['user'],cloudinit_paths['network'],
                    cloudinit_paths['vendor'], 'User Configuration']

    template_dir = shared.menu_multi(title, question, menu_options)

    # return to main event loop
    if template_dir == 'user_quit':
        return

    # returns a dict with keys 'menu' / 'title' / 'template_type'
    menu_context = helpers.get_menu_context(template_dir, 'Choose', 'edit')

    # user config chosen
    if Path(template_dir).is_file():
        templates.get_user_config()
    else:
        # infinite loop for editing multiple files
        while True:
            template_files = utils.find_files('*.yaml', template_dir)

            # sanity checks
            if len(template_files):
                # generate 2nd menu (see menus.py)
                # get_choice() returns a dict with 2 x keys ('key' / 'value')
                menu = Menu(menu_context['title'], menu_context['question'], template_files, 'keys')
                choice_dict = menu.get_choice()

                # return to main event loop
                if choice_dict['value'] == 'user_quit':
                    return

                template_path = choice_dict['value']

                # edit template (no confirmation dialog)
                utils.edit_file(template_path, USER_CONFIG.console_editor)
            else:
                print(f"\nError: no {menu_context['template_type']} found in: {template_dir}")
                break


def menu_delete():
    """ Displays the menu to choose custom template or config to delete.
    """
    title = "Delete Template / Override"
    question = "Choose template / override directory ?"
    cloudinit_paths = USER_CONFIG.get_cloudinit_paths()
    menu_options = ['Standard Templates', 'Custom Templates', 'Custom Overrides',
                    cloudinit_paths['user'],cloudinit_paths['network'], cloudinit_paths['vendor']]

    # SOURCE Template
    template_dir = shared.menu_multi(title, question, menu_options )

    # return to main event loop
    if template_dir == 'user_quit':
        return

    # returns a dict with keys 'menu' / 'title' / 'template_type'
    menu_context = helpers.get_menu_context(template_dir, 'Choose', 'delete')

    # infinite loop for deleting multiple files
    while True:
        template_files = utils.find_files('*.yaml', template_dir)

        # generate menu context
        menu_context = helpers.get_menu_context(template_dir, 'Choose', 'remove')

        # sanity checks
        if len(template_files):
            # generate 2nd menu (see menus.py)
            # Menu can display 'keys' (filename) or 'value' (file path) or 'both'
            menu = Menu(menu_context['title'], menu_context['question'], template_files, 'keys')
            # get_choice() returns a dict with 2 x keys ('key' / 'value')
            choice = menu.get_choice()
            file_path = choice['value']
            file_name = choice['key']

            # return to main event loop
            if file_path == 'user_quit':
                return

            # confirm delete
            choice = utils.get_input(f"Delete config: {file_name} [N/y]: ? ",
                                        accept_empty=True
                                    )
            if choice.startswith('y') or choice.startswith('Y'):
                utils.delete_dirs_or_files(file_path)
        else:
            print(f"\nError: no {menu_context['template_type']} found in: {template_dir}")
            break


def menu_copy():
    """ Copies existing template to a new one & optionally
        opens it in the configured editor.
    """
    title = 'Copy Templates / Overrides'
    question = 'Select SOURCE directory'
    cloudinit_paths = USER_CONFIG.get_cloudinit_paths()

    # SOURCE Template 1st Menu
    menu_options = ['Standard Templates', 'Custom Templates', 'Custom Overrides',
                    cloudinit_paths['user'], cloudinit_paths['network'], cloudinit_paths['vendor']]
    template_dir = shared.menu_multi(title, question, menu_options)

    # return to main event loop
    if template_dir == 'user_quit':
        return

    # infinite loop for copying multiple files
    # menu.get_choice() runs utils.die() on empty input instead of integer to exit the loop
    while True:
        template_files = utils.find_files('*.yaml', template_dir)

        # generate menu context
        menu_context = helpers.get_menu_context(template_dir, 'Choose', 'copy')

        # sanity checks
        if len(template_files) == 0:
            print(f"\nError: no {menu_context['template_type']} found in {template_dir}")

        # generate 2nd menu (see menus.py)
        # Menu can display 'keys' (filename) or 'value' (file path) or 'both'
        menu = Menu(menu_context['title'], menu_context['question'], template_files, 'keys')

        # get_choice() returns a dict with 2 x keys ('key' / 'value')
        choice = menu.get_choice()
        src_template = choice['value']
        template_name = choice['key']

        # return to main event loop
        if src_template == 'user_quit':
            return

        # DESTINATION: for standard images choose destination dir (images or custom)
        if template_dir == USER_CONFIG.subdir_images:
            title = 'Copy Standard Templates to Directory'
            question = 'Select DESTINATION directory'
            menu_options = ['Standard Templates', 'Custom Templates']
            destination_dir = shared.menu_multi(title, question, menu_options)

            # return to main event loop
            if template_dir == 'user_quit':
                return
        else:
            destination_dir = template_dir
            # formatting
            print('')

        # get new filename / subdir name
        prompt = f"Copy {template_name} => ? (empty returns to main menu) : "
        new_template = utils.get_input(prompt, accept_empty=True)

        # return to main event loop
        if new_template == 'N':
            return

        dest_template = f"{destination_dir}/{new_template}.yaml"
        print(f"\nCopy: {src_template}")
        print(f"====> {dest_template}")
        choice = utils.get_input('\nConfirm copy [Y/n]: ? ', accept_empty=True, default='Y')

        # copy template
        if choice.startswith('y') or choice.startswith('Y'):
            utils.copy_dirs_or_files(src_template, dest_template)

            # edit file (no confirmation dialog)
            utils.edit_file(dest_template, USER_CONFIG.console_editor)


def generate_custom_template():
    """ Displays the menus to generate custom template FROM override
    """
    title = "Generate Custom Template FROM Override"
    question = "Choose SOURCE template to override"
    os_name, src_template = shared.select_src_template(title, question)

    # return to main event loop
    if src_template == "user_quit":
        return

    # show context
    src_type = helpers.get_template_type(src_template)
    print(f"\nOverriding {src_type} SOURCE template: {os_name}")

    # choose OVERRIDE file / menu
    override_name, override_template = menu_override()

    # return to main event loop
    if override_name == "user_quit":
        return

    merge_files = [src_template, override_template]

    # DESTINATION: check input
    question = f"Enter new custom template name [{override_name}]  ? : "
    custom_template = utils.get_input(question, accept_empty=True, default=override_name)
    dest_custom = f"{USER_CONFIG.subdir_custom}/{custom_template}.yaml"

    # check if overwriting
    if Path(dest_custom).exists():
        print(f"\nWARN: existing template will be overwritten: {dest_custom}")

    print(f"\nGenerate template FROM {src_type} template: {Path(src_template).stem}")
    print(f"Merged with template override: {Path(override_template).stem}")
    print(f"\nTO: ==============> {Path(dest_custom).stem}")
    choice = utils.get_input('\nConfirm create custom template [Y/n]: ? ',
                             accept_empty=True, default='Y'
                            )
    # construct custom merged YAML
    if choice.startswith('y') or choice.startswith('Y'):
        try:
            # yq_check = True checks for a golang version of yq
            utils.yaml_merge(USER_CONFIG.yq_check, dest_custom, *merge_files)

        # cross platform & also catches permission errors
        except (OSError, IOError) as err:
            # err.args is a tuple (err_code, err_message)
            utils.die(1, f"Error: {err.args[1]} : {dest_custom}")

        # optionally add cloudinit content
        cloud_choice = utils.get_input('Merge cloud-init configuration [Y/n]: ? ',
                                       accept_empty=True, default='Y'
                                      )
        if cloud_choice.startswith('y') or cloud_choice.startswith('Y'):
            # tidies up template & optionally edits it
            cloudinit_file = cloudinit.merge_cloudinit(dest_custom, edit=False,
                                                       update_footer=False
                                                       )
        else:
            # tidy up template
            utils.format_template(dest_custom)

        footer_data = create_footer_data(src_template, override_template, custom_template,
                       dest_custom, cloudinit_file)

        # add data for regenerating custom templates
        utils.add_custom_footer(dest_custom, footer_data)

        # optionally edit template
        question = 'Edit new custom template [Y/n]: ? '
        utils.edit_file(dest_custom, USER_CONFIG.console_editor, question=question)


def create_footer_data(src_template, override_template, custom_template,
                       dest_custom, cloudinit_file):
    """ Creates the data which is written as a json comment by
        utils.add_custom_footer() to all custom templates for use
        in regenerate_template()

    Args:
        src_template (str): path to source template
        override_template (str): path to override template
        cloudinit_file (str): path to cloudinit file
        dest_custom (str): path to destination template
        custom_template (str): destination template name

    Returns:
        dict: containing data to regenerate the template
    """
    footer_data, cloudinit_dict = {}, {}
    footer_data['source'] = src_template
    footer_data['override'] = override_template

    if USER_CONFIG.subdir_images in src_template:
        footer_data['type'] = 'base'
    else:
        footer_data['type'] = 'custom'

    footer_data['name'] = custom_template
    footer_data['destination'] = dest_custom

    if cloudinit_file != 'user_quit':
        cloudinit_type = cloudinit.get_cloudinit_type(cloudinit_file)
        cloudinit_dict[cloudinit_type] = cloudinit_file
        footer_data['cloudinit'] = cloudinit_dict
    else:
        footer_data['cloudinit'] = None

    return footer_data


def create_custom_override():
    """ Displays the menu to create custom template overrides (with file & package sections)
    """
    title = "Create Custom Template Override (with file / package sections)"
    question = "Choose SOURCE template directory ?"
    menu_options = ['Standard Templates', 'Custom Templates']

    # SOURCE Template
    template_dir = shared.menu_multi(title, question, menu_options)

     # return to main event loop
    if template_dir == 'user_quit':
        return

    template_files = utils.find_files('*.yaml', template_dir)
    template_type = helpers.get_template_type(template_dir)

    # menu_templates() returns a tuple: os_name, template_path
    src_template = shared.menu_templates(template_files, template_dir, 'Create Override from',
                        custom_question=f"Choose SOURCE {template_type} template to override"
                        )[1]
    # return to main event loop
    if src_template == 'user_quit':
        return

    # DESTINATION template
    new_override = utils.get_input('Enter new template override name ? : ')
    dest_override = f"{USER_CONFIG.subdir_overrides}/{new_override}.yaml"

    # choose files paths
    files_list = helpers.select_file_paths()

    # check destination
    if Path(dest_override).exists():
        print(f"\nWARN: custom override exists: {dest_override}")

    print(f"\nExtract overrides: {src_template}")
    print(f"=================> {dest_override}")
    choice = utils.get_input('\nConfirm create overrides [Y/n]: ? ', accept_empty=True, default='Y')

    # extract YAML sections
    if choice.startswith('y') or choice.startswith('Y'):
        helpers.write_override(src_template, dest_override, new_override, files_list)

        # edit new override
        question='\nEdit new override [Y/n]: ? '
        utils.edit_file(dest_override, USER_CONFIG.console_editor, question=question)
    else:
        print(f"Cancelling creation of: {dest_override}")


def menu_build():
    """ Displays initial build menus & gathers template name
        & version options for build_image()
    """

    menu_options = ['Standard Templates', 'Custom Templates']

    # ARGS.lxd is usually true so check lxc
    if ARGS.lxc:
        container_type = 'LXC'
    else:
        container_type = 'LXD'

    title = f"Build {container_type} Image"
    question = "Choose template directory ?"

    # choose default or custom templates
    template_dir = shared.menu_multi(title, question, menu_options)

    # return to main event loop
    if template_dir == 'user_quit':
        return

    template_files = utils.find_files('*.yaml', template_dir)

    # distribution menu
    os_name, template_path = shared.menu_templates(template_files,
                                                    template_dir, 'build', title
                                                  )
    # return to main event loop
    if template_path == 'user_quit':
        return

    # main computation
    version_list = templates.load_json_cache()

    # version menu
    build_options = menu_versions(os_name, version_list, template_path)

    # return to main event loop
    if build_options == 'user_quit':
        return

    # run distrobuilder
    builder.build_image(build_options, template_path)
