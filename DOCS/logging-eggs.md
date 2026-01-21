# Logging in penguins-eggs

`penguins-eggs` adheres to the Unix philosophy regarding logging: **it does not create log files automatically**. Instead, it writes information to standard output (`stdout`) and errors to standard error (`stderr`).

This design gives you full control over how to handle logs, allowing you to view them in real-time, save them to a file, or pipe them to other tools.

## Basic Usage

To save the output of a command to a file while still seeing it on your screen, use the `tee` command:

```bash
sudo eggs produce | tee eggs-produce.log
```

If you want to append to an existing log file instead of overwriting it, use the `-a` flag:

```bash
sudo eggs produce | tee -a eggs-produce.log
```

## Verbose Mode

For more detailed information about what `eggs` is doing under the hood, use the `--verbose` flag. This will print the specific system commands being executed.

```bash
sudo eggs produce --verbose | tee eggs-produce-verbose.log
```

This is particularly useful for debugging or understanding the exact steps `eggs` is taking during the remastering process.

## Debugging

If you are developing or deeply debugging `eggs`, you might encounter a "Debug Mode". This usually pauses execution and waits for user input to proceed. It is intended for developers and is not typically encountered during normal usage unless specifically invoked in the code.

## Summary

*   **Standard Output**: Normal info and progress.
*   **Standard Error**: Errors and critical warnings.
*   **`--verbose`**: Detailed command execution logs.
*   **Persistence**: Use `tee` or `>` to save logs to a file.
