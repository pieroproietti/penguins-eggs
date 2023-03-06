# tsconfig

Se inseriamo "moduleResolution": "node16" abbiamo errore anche su inquirer@^8.0.0 nonostante sia raccomandato per la risoluzione commonjs

```
{
  "compilerOptions": {
    "jsx": "react",
    "allowJs": true,
    "importHelpers": true,
    "esModuleInterop": true,
    "module": "Node16",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "lib": ["es2021"],
    "target": "es2021",
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*"
  ]
}
```