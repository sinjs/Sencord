# Installing

There are multiple ways to install Sencord.

## (Recommended) Using the installer

This method is the easiest and works by patching your Discord installation. It will have to be re-installed using the installer on most Discord updates.

[**Click here to download the latest version of the installer**](https://github.com/sinjs/SencordInstaller/releases/latest)

## (Recommended on Linux) Using Sesktop

Sesktop is a custom Discord App aiming to give you better performance and improve linux support. It embeds Discord Web in an electron application, which allows for
enhanced privacy and removes the need to re-patch Discord every time.

[**Click here to visit the installation guide**](https://github.com/sinjs/Sesktop/blob/main/docs/installation.md)

## Installing from source

You can install Sencord and patch the Discord installation from source code. This is more complicated as it's meant for developers.

### Prerequisites

-   Git
-   pnpm 10.4.1 (recommended to use corepack)
-   Node.JS v18 or newer

### Cloning & Dependencies

```
git clone https://github.com/sinjs/Sencord.git
cd Sencord
pnpm install --frozen-lockfile
```

### Building

```
pnpm build
```

### Injecting (close discord first)

```
pnpm inject
```

### Updating

```sh
git pull

# If this doesnt work because of local changes, reset first then run git pull again
git reset --hard
git pull

# If dependencies have changed, you may need to re-run this command
pnpm install --frozen-lockfile

pnpm build

# If discord has updated, you may need to re-inject
pnpm inject
```

### Uninstalling (close discord first)

```
pnpm uninject
```
