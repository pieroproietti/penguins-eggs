This `config.js` file MUST ONLY be a symbolic link to `../node_modules/oclif-pnpm/lib/tarballs/config.js`.

To recreate it:

```
rm config.js
ln -s ../node_modules/oclif-pnpm/lib/tarballs/config.js config.js
```