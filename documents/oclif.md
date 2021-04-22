
# To solve the problem to compile without be root


edit ./node_modules/@oclif/dev-cli/lib/commands/pack/deb.js

go line 67, and replace
```js
            await qq.rm(workspace);
            await qq.x(`sudo rm "${workspace}" -rf`);
```
a little down add sudo to:
```js
            await qq.x(`sudo chown -R root "${workspace}"`);
            await qq.x(`sudo chgrp -R root "${workspace}"`);
```
