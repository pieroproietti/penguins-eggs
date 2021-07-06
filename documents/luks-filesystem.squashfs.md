# 1. Create compressed squashfs image

We are starting with /home/eggs/ovarium/iso/live/filesystem.squashfs created by eggs

# 2. Reencrypt the image to wrap it in a LUKS container

Create a little additional room for the reencryption routine at the end of the image. Only half of the additional room is used for the header, so the manpage recommends using double the recommended minimum header size – so 32 MiB for `luks2`. Less is okay if you don't need the metadata space or are close to the maximum disc size.

This operation can potentially **eat your data**, so make sure you have a backup or can regenrate the file.

    # create an empty volume
    dd if=/dev/zero of=crypted-filesystem.img bs=1 count=0 seek=32G

    # Next, we will encrypt our container
    sudo cryptsetup luksFormat crypted-filesystem.img 

    # Now, we can unlock our container and map it as /dev/mapper/filesystem
    sudo cryptsetup luksOpen crypted-filesystem.img cryped-filesystem

    # format crypted-filesystem
    sudo mkfs.ext4 /dev/mapper/crypted-filesystem


    # mount volume crypted
    sudo mount /dev/mapper/crypted-filesystem ./crypted-filesystem

    cp /home/eggs/ovarium/iso/live/filesystem.squashfs ./crypted-filesystem

    # copia dei files in /dev/mapper/filesystem 
    cp /filesystem /crypted-filesystem -R

    # umount
    sudo umount ./crypted-filesystem 















    # before to encrypt you can mount filesystemfs.squashfs simply:
    sudo mount /home/eggs/ovarium/iso/live/filesystem.squashfs /mnt/





    # add 32M additional spaces
    sudo truncate -s +32M /home/eggs/ovarium/iso/live/filesystem.squashfs

    # crypto
    sudo cryptsetup -q reencrypt --encrypt --type luks2 --resilience none --disable-locks --reduce-device-size 32M \
    /home/eggs/ovarium/iso/live/filesystem.squashfs \
    crypted_filesystem.squashfs

    # open 
    # sudo cryptsetup luksOpen /dev/mapper/crypted_filesystem.squashfs decrypted_filesystem.squashfs --verbose --debug

    # this should work
    sudo cryptsetup --type luks2 open /dev/mapper/crypted_filesystem.squashfs decrypted_filesystem.squashfs --verbose --debug

    # mount
    sudo mount /dev/mapper/decrypted_filesystem.squashfs /mnt

You can check with `cryptsetup luksDump filesystem.squashfs` that the data segment is offset at only half the additional size and then trim the size accordingly.

    truncate -s -4M filesystem.squashfs

# 3. Burn encrypted container to a DVD

Now simply burn the `filesystem.squashfs` to a disc like you would do with an `*.iso`. In graphical tools you probably need to select "All Files" to be able to select it.

    growisofs -dvd-compat -Z /dev/sr0=image.sqfs

# 4. Congratulations

If your graphical desktop uses some sort of automounter you should see a password prompt pop up after the disc tray is reloaded. Otherwise handle it like you would handle a normal encrypted block device and mount the squashfs filesystem inside.

    sudo cryptsetup open /dev/sr0 cryptdvd
    sudo mount -t squashfs /dev/mapper/cryptdvd /mnt

---

# Add Integrity Checking and Error Correction

With a compressed and encrypted image like the one above, everything can go to sh\*t if there is a single bit flip in the encrypted container, leading to a chain of unrecoverable errors. I'm not going into any longevity comparisons between optical media and hard disks but we all know DVDs can go bad through scratches, dirt or decomposition. Ideally, you're able to correct erroneous sectors but at the absolute minimum you'll want to know when your data is garbled.

Hence, I looked into some methods to add checksumming and parity data to the image.

## I) Simple and Compatible with PAR2

The simple approach would be to just generate some parity blocks with `par2`. This tool is widespread and will probably still be obtainable in a few decade's time. Being a Reed-Solomon erasure coding, you can specify how much parity data you would like to have, in percent. The calculations will take a lot of time on multi-Gigabyte images though.

    par2 create -r10 image.sqfs

This will create a number of files next to the image, that you can then burn to the disc in a standard UDF filesystem.

    growisofs -Z /dev/sr0 -udf ./

## II) Integrity and Error-Correction with `dm-verity`

Another solution is to use another device-mapper layer of the Linux kernel. Although this is a relatively new feature, it should be widely available already – at least in a recent Ubuntu. `dm-verity` creates a tree-like structure of block hashes up to a root hash, that needs to be stored externally somehow. It creates a cryptographically sound method to verify the integrity of the disc and it allows adding – again Reed-Solomon coded – parity blocks to restore detected bad blocks.

Since it is a device-mapper which is supposed to work with raw disk devices, I would expect it to fare better with unresponsive or badly scratched discs, that return many bad sectors. But for lack of a reliable way to inject precise faults on optical discs I cannot test this assumption. I am not sure how this method behaves if you were to have a bad sector exactly where the verity superblock is supposed to be on the disc.

There is two methods to this. Either you create the hash-tree and parity blocks in files next to the encrypted image and then burn them in a UDF filesystem like in method I). Or you reuse the same image file and specify offsets for the different parts. The former would have the advantage that you can add README files and reuse existing recovery tools to read the files from disc and then try to restore them locally. The latter would minimize the number of layers but does require some calculation for the offsets. Either way you somehow need to store the generated root  hash for this to make any sense at all! I propose writing it on the disc itself or encoding it in a QR code and printing it on the leaflet that you put in the case.

### Calculating Offsets

If we want to reuse a single file with `veritysetup`, you need to know where to place the hash and error correction blocks.

The hash offset is relatively straightforward, since it is simply the amount of data you have, i.e. the size of the image. First of all make sure that it is a multiple of `4096` bytes, which is the default blocksize of `veritysetup`! `mksquashfs` uses a default block size of 128 KiB, so this should be given here. Therefore `--hash-offset`and `--data-blocks` are calculated as:

    stat -c%s image.sqfs |\
      awk '{ printf "--hash-offset=%d --data-blocks=%d\n", $1, $1/4096 }'

The `--fec-offset` is a little more tricky because you need to know how many hash blocks are going to be written, which is not *completely trivial* due to the tree structure. You can calculate it recursively though. The following Python snippet assumes 4k data and hash sectors and 32 bit hashes, thereby fitting 128 hashes into one hash block.

```python
import math
# hs := hash sectors, ds := data sectors
def hs(ds, superblock=False):
  h = 1 if superblock else 0
  while ds > 1:
    ds = math.ceil(ds / 128)
    h += ds
  return h
```

So for a small file with 72884224 bytes or 17794 data blocks, it would result in 144 hash blocks. The `--fec-offset` would then be `(data-blocks + hash-blocks) * 4096` – in this case 73474048. The format command for my small test file would then be:

    veritysetup format --fec-roots=24 --data-blocks=17794 --hash-offset=72884224 --fec-offset=73474048 {--fec-device=,,}image.sqfs

## TODO / WARNING

So far I couldn't verify any actual corruption cases where I overwrote the first few blocks with `dd` ...

This may or may not have been due to [cryptsetup/cryptsetup#554](https://gitlab.com/cryptsetup/cryptsetup/-/issues/554). I haven't checked again since then.