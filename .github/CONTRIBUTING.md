# Contributing to penguins-eggs

First off, thank you for considering contributing to penguins-eggs! It's people like you that make this project great.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs
Bugs are tracked as GitHub issues. Please use our **Bug Report template** to provide all the necessary details.

### Suggesting Enhancements
Enhancement suggestions are also tracked as GitHub issues. Please use our **Feature Request template**.

## Your First Code Contribution

Ready to contribute? Here's how to set up your environment and submit your first pull request.

1.  **Fork the repository** on GitHub.

2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/pieroproietti/penguins-eggs
    ```

3.  **Create a new branch** for your changes. Please use a descriptive name.
    ```bash
    # Example branch names:
    # feat/add-new-login-button
    # fix/resolve-api-error-on-startup
    git checkout -b your-branch-name
    ```

4.  **Set up the development environment.**
    You need to install nodejs, pnpm, your favourite editor. A short way to start is to download one of mine **colibri** ISOs and install it in a VM.
    ```bash
    pnpm install
    ```

5.  **Make your changes** to the code.

6.  **Tests eggs from sources**.
    ```bash
    pnpm build
    ./eggs
    ```

7.  **Commit your changes.** Please follow our commit message conventions.
    ```bash
    git commit -m "feat: Describe your amazing new feature"
    ```

8.  **Push your branch** to your fork on GitHub:
    ```bash
    git push origin your-branch-name
    ```

9.  **Open a Pull Request** to the `main` branch of the original repository.
    * Fill out the pull request template.
    * Provide a clear description of the problem and solution. Include the relevant issue number if applicable (e.g., `Closes #37`).

## Style Guides

### Git Commit Messages
* Use the present tense ("Add feature" not "Added feature").
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
* Limit the first line to 72 characters or less.

### Code Style
Please ensure your code adheres to the style guides used in this project. We use [Tool Name] to enforce code style. Run `[command]` before committing.

---
