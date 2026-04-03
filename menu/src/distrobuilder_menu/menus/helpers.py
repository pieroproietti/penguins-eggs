""" Menu helper functions
"""
from pathlib import Path
# app modules
from distrobuilder_menu import utils
# app classes
from distrobuilder_menu.config.user import Settings

# globals
# singleton class shares user config between modules
USER_CONFIG = Settings.instance()

def find_os(template):
    """ loops through the image_dict & returns the os_name (key) of the template (value)
    """
    distribution = get_distribution(template)
    image_dict = get_image_dict()

    # sanity check
    if not image_dict:
        utils.die(1, 'Error: find_os() found no data')

    for key, value in image_dict.items():
        if value == distribution:
            os_name = key
            break
    return os_name


def get_image_dict():
    """ Generates a dict of os_name : template_path dict from the default templates
    """
    # write this data out to JSON during weekly download ??
    image_dict = {}

    # find_files returns a dict of os (from the filename) : template_path
    template_files = utils.find_files('*.yaml', USER_CONFIG.subdir_images)

    # loop through original templates
    for key, value in template_files.items():
        image_dict[key] = get_distribution(value)

    return image_dict


def get_distribution(template):
    """ Convenience function used by build_image() find_os() get_image_dict()
        Returns the inner distribution name from template YAML
    """
    data = utils.read_config(template, False)
    return data['image']['distribution']


def get_menu_context(template_dir, pre_str, action):
    """ Constructs menu title & question strings in context
        of it's action & template type.

        Returns: dict with keys: 'title' 'question' 'template_type'
    """
    menu_context = {}

    # change menu context based on type
    if template_dir == USER_CONFIG.subdir_overrides:
        template_type = 'override template'
    elif template_dir == USER_CONFIG.subdir_custom:
        template_type = 'custom template'
    elif template_dir == USER_CONFIG.subdir_images:
        template_type = 'standard template'
    elif template_dir == USER_CONFIG.cloudinit_dir:
        template_type = 'cloud init config'
    else:
        # user config in menu_edit()
        template_type = 'file'

    menu_context['template_type'] = template_type
    # alternative to string.capwords (to avoid importing string)
    menu_context['title'] = f"{action} {template_type} : ".title() + template_dir
    menu_context['question'] = f"{pre_str} {template_type} to {action} ?"

    return menu_context


def get_template_type(template):
    """ Convenience function for template types

    Args:
        template (path): path to the template

    Returns: 'standard' || 'custom'
    """
    if USER_CONFIG.subdir_images in template:
        template_type = 'standard'
    else:
        template_type = 'custom'
    return template_type


def select_file_paths():
    """ Used by create_custom_override() to add the file paths to include
        in the override file used to generate a custom template

    Returns:
        set: files_list
    """
    files_list = ['home', 'etc', 'root', 'init-scripts', 'cloudinit-per-once']
    choice = utils.get_input(f"Change default files list: {files_list} [N/y] ? ",
                             accept_empty=True, default='N'
                            )
    if choice.startswith('y') or choice.startswith('Y'):
        regex = '[a-z ]+'
        tmp_list = utils.get_input("Enter space separated paths: ", regex)
        # remove duplicates
        files_list = set(tmp_list.split())
    return files_list


def write_override(src_template, out_file, override_name, path_list):
    """ Writes an example custom override with options from create_custom_override()
        & calls yaml merge functions

    Args:
        src_template (str): source template name
        out_file (str): output filename
        override_name (str): output directory
        path_list (list[]): list of paths
    """
    files_node = {}
    overrides = []
    source_path = f"{USER_CONFIG.files_dir}/{override_name}"
    var_list = ['- generator:', 'packages:']

    # formatting
    print('')

    # create object for files copy generator
    for path in path_list:
        # new dict required on each loop
        generator_copy = {}
        override_path = f"{source_path}/{path}"

        generator_copy['generator'] = 'copy'
        generator_copy['source'] = override_path

        # make scripts executable
        if path in ('init-scripts', 'cloudinit-per-once'):
            generator_copy['mode'] = 700
        else:
            generator_copy['mode'] = 644

        # custom destination paths
        if path == 'init-scripts':
            generator_copy['path'] = "/etc/init.d"
        elif path == 'cloudinit-per-once':
            generator_copy['path'] = "/var/lib/cloud/scripts/per-once/"
        else:
            # standard top level paths
            generator_copy['path'] = f"/{path}/"

        overrides.append(generator_copy)

        # create files paths so distrobuilder doesn't error
        if not Path(override_path).exists():
            print(f"Creating: {override_path}")
            Path(override_path).mkdir(parents=True)

    # formatting
    print('')

    files_node['files'] = overrides
    # write object as YAML
    utils.write_config(out_file, files_node)
    # append packages node & insert lines yq fix
    # multiple nodes can be extracted with '^(packages|files)'
    utils.yaml_extract(USER_CONFIG.yq_check, src_template, out_file, '^packages')
    # the current implementation of golang-yaml (used by yaml_merge() via yq)
    # removes blank lines from YAML configuration & distrobuilder expects a blank line
    # to be between each top level node key in template YAML so we insert blank lines
    utils.insert_blank_lines(out_file, 'before', var_list)
