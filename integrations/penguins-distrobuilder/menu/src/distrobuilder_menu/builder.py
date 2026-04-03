""" Functions for building the LXD / LXC images.
"""
import subprocess
from pathlib import Path
# app modules
from distrobuilder_menu import utils
# app classes
from distrobuilder_menu.config.app import AppConfig
from distrobuilder_menu.config.user import Settings

# singleton classes
# shares config between modules
ARGS = AppConfig.instance().get()
USER_CONFIG = Settings.instance()
DEBUG_TIMER = utils.Timer(ARGS.timer)

def get_build_user_options(build_options, template_path):
    """ Used by build_image() to get build options from user config

    Args:
        build_options (dict): see output of menu_versions()
        template_path (str): absolute path to template yaml

    Returns:
        str: command line options for distrobuilder
    """
    user_cmd_list = []

    # build user configurable distrobuilder flags
    user_cmd_list.append(template_path)

    if USER_CONFIG.target_dir:
        user_cmd_list.append(USER_CONFIG.target_dir)

    # image options
    user_cmd_list.append(f"-o image.release={build_options['release']}")
    user_cmd_list.append(f"-o image.variant={build_options['variant']}")

    if USER_CONFIG.cache_dir:
        user_cmd_list.append(f"--cache-dir={USER_CONFIG.cache_dir}")

    if USER_CONFIG.compression:
        user_cmd_list.append(f"--compression={USER_CONFIG.compression}")

    if USER_CONFIG.timeout:
        user_cmd_list.append(f"--timeout={USER_CONFIG.timeout}")

    # boolean image options
    if USER_CONFIG.cleanup:
        user_cmd_list.append('--cleanup')

    if USER_CONFIG.debug:
        user_cmd_list.append('--debug')

    if USER_CONFIG.disable_overlay:
        user_cmd_list.append('--disable-overlay')

    # 'vm' type removed in get_template_data() for LXC
    if build_options['type_top_level'] == 'virtual-machine':
        user_cmd_list.append('--vm')

    # concatenate command list
    user_cmd = " ".join(user_cmd_list)
    return user_cmd


def get_build_options(build_options, template_path):
    """ Creates a dict with main build options & concatenates
        the user options

    Args:
        build_options (dict): see output of menu_versions()
        template_path (str): absolute path to yaml build template

    Returns:
        dict: main_opts (i.e build LXC or LXD) & it's subcommand
        str: lxd_options

        lxd_opts_list, main_opts
    """
    main_opts = {}
    lxd_opts_list = []

    # custom templates use template name for 'os'
    if USER_CONFIG.subdir_custom in template_path:
        build_options['os'] = f"{Path(template_path).stem}"

    # construct image alias
    image_alias = (
        f"{build_options['os']}-{build_options['release']}-{build_options['variant']}"
    )

    # ARGS.lxd is usually True so check ARGS.lxc
    if ARGS.lxc:
        # LXC rootfs / metadata archive output can be extracted to /var/lib/lxc via:
        # lxc-create <container-name> -t local -- --metadata meta.tar.xz --fstree rootfs.tar.xz
        # https://www.mail-archive.com/lxc-users@lists.linuxcontainers.org/msg08142.html
        main_opts['main_cmd'] = 'build-lxc'
        main_opts['container_type'] = 'LXC'
    else:
        main_opts['main_cmd']  = 'build-incus'
        main_opts['container_type'] = 'LXD'

        # LXD only options
        if USER_CONFIG.lxd_output_type:
            lxd_opts_list.append(f"--type={USER_CONFIG.lxd_output_type}")

        if USER_CONFIG.import_into_lxd:
            check_lxd_socket()

            # VM alias
            if build_options['type_top_level'] == 'virtual-machine':
                image_alias = f"{image_alias}-vm"

            lxd_opts_list.append(f"--import-into-incus={image_alias}")

    # concatenate command list
    lxd_options = " ".join(lxd_opts_list)
    main_opts['image_alias'] = image_alias
    return lxd_options, main_opts


def check_lxd_socket():
    """ Distrobuilder expects to find /var/lib/incus/unix.socket to import images
        so under LXD symlink /var/lib/incus => /var/lib/lxd
    """
    lxd_path = Path('/var/lib/lxd')
    incus_path = Path('/var/lib/incus')

    # valid symlinks are also true
    if not incus_path.is_dir():
        if lxd_path.is_dir() and not incus_path.is_symlink():
            print(f"\nCreating incus compatibility symlink: {incus_path} => {lxd_path}")
            cmd = f"sudo ln -s {lxd_path} {incus_path}"
            utils.check_command(cmd, exit_on_error=True)

        if not incus_path and not lxd_path:
            print("A local install of incus or lxd is required to import built images")
            utils.die(1, "Please run 'dbmenu -s' & set 'import_into_lxd' to False under settings")


def check_lxd_image(main_options):
    """ Checks for an identically named LXD image & optionally
        deletes it

    Args:
        main_options (dict): output by get_build_options()
    """
    # check if existing LXD image will be overwritten
    if main_options['container_type'] == 'LXD':
        image_alias = main_options['image_alias']
        try:
            # run shell command from python displaying output
            print(f"\nChecking for existing image: {image_alias}\n")
            lxd_binary = utils.get_lxd_binary()
            lxd_cmd = f"sudo {lxd_binary} image get-property {image_alias} os &>/dev/null"

            # check=True raises CalledProcessError on non zero returncode
            subprocess.run(lxd_cmd, shell=True, check=True)
            choice = utils.get_input(f"Delete existing image: {image_alias} [Y/n]: ? ",
                                        accept_empty=True, default='Y'
                                    )
            if choice.startswith('y') or choice.startswith('Y'):
                try:
                    # run shell command from python displaying output
                    print(f"Deleting image: {image_alias}")
                    lxd_cmd = f"sudo {lxd_binary} image delete {image_alias}"
                    subprocess.run(lxd_cmd, shell=True, check=True)
                except subprocess.CalledProcessError:
                    utils.die(1, f"\nError removing: {image_alias} in build_image()")
            else:
                utils.die(1, f"\nCancelled build of: {image_alias}\n")
        except subprocess.CalledProcessError:
            # sudo timeouts also pass here
            print("Image Alias is OK")


def build_image(build_options, template_path):
    """ Final stage to build an LXD / LXC container or vm image
        reads the build_options dict & the build flags from user defined YAML
        & concatenates the distrobuilder command.
    """
    user_options = get_build_user_options(build_options, template_path)
    lxd_options, main_options = get_build_options(build_options, template_path)
    image_alias = main_options['image_alias']

    # check if existing LXD image will be overwritten
    if main_options['container_type'] == 'LXD':
        check_lxd_image(main_options)

    # build image
    build_cmd = f"sudo distrobuilder {main_options['main_cmd']} {user_options} {lxd_options}"
    print(f"\ncmd = {build_cmd} \n")

    choice = utils.get_input(f"Build {main_options['container_type']} image [Y/n]: ? ",
                             accept_empty=True, default='Y'
                            )
    if choice.startswith('y') or choice.startswith('Y'):
        # formatting
        print('')

        try:
            # run shell command from python displaying output
            output = subprocess.run(build_cmd, shell=True, check=True)
        except subprocess.CalledProcessError:
            utils.die(1, "\nError from distrobuilder: => check template YAML.")

        # rename images
        if output.returncode == 0:
            if main_options['container_type'] == 'LXD':
                rename_lxd_image(image_alias)
            else:
                rename_lxc_image(image_alias)


def rename_lxc_image(image_alias):
    """ Renames the rootfs / meta archives to include the image_alias

    Args:
        image_alias (str): see get_build_options() for it's format
    """
    output = utils.find_latest_files(USER_CONFIG.target_dir, 2)
    rootfs_path = f"{USER_CONFIG.target_dir}/{output[0]}"
    meta_path = f"{USER_CONFIG.target_dir}/{output[1]}"

    rootfs_custom_path = (
        f"{USER_CONFIG.target_dir}/{image_alias}-rootfs.tar.{USER_CONFIG.compression}"
    )
    meta_custom_path = (
        f"{USER_CONFIG.target_dir}/{image_alias}-meta.tar.{USER_CONFIG.compression}"
    )
    utils.move_file(rootfs_path, rootfs_custom_path)
    utils.move_file(meta_path, meta_custom_path)

    lxc_paths = f"--metadata {meta_custom_path} --fstree {rootfs_custom_path}"
    lxc_cmd = f"lxc-create {image_alias} -t local -- {lxc_paths}"
    print(f"LXC image: '{image_alias}' can be installed with:\n\n{lxc_cmd}")


def rename_lxd_image(image_alias):
    """ LXD image names are timestamped - renames the image to it's
        alias so custom images are differentiated from the distribution
        name & they have a known name format to import into LXD

    Args:
        image_alias (str): see get_build_options() for it's format
    """
    output = utils.find_latest_files(USER_CONFIG.target_dir, 1)
    image_path = f"{USER_CONFIG.target_dir}/{output[0]}"

    # rename custom image to it's alias
    custom_path = (
        f"{USER_CONFIG.target_dir}/{image_alias}.tar.{USER_CONFIG.compression}"
    )
    utils.move_file(image_path, custom_path)

    # show LXD image properties
    if USER_CONFIG.import_into_lxd:
        lxd_binary = utils.get_lxd_binary()
        lxd_cmd = f"sudo {lxd_binary} image ls {image_alias}"
        try:
            subprocess.run(lxd_cmd, shell=True, check=True)
        except subprocess.CalledProcessError:
            # sudo timeouts do not give an err.output tuple
            utils.die(1, f"Error: displaying LXD image details: {image_alias}")
