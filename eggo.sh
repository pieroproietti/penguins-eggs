echo "--PENGUIN'S EGGS .deb-based installer(Eggo)--"
echo "By robert19066"
echo "cheking for .deb file"
# check if in the /Eggo dir is the latest .deb file from https://github.com/pieroproietti/penguins-eggs"
if ls ./Eggo/*.deb 1> /dev/null 2>&1; then
    echo ".deb file found, installing,we dont know if its the latest version, if you want the latest version delete the .deb file and run the script again."
    #dowload the latest .deb file from the github releases page
    echo "Installing..."
    sudo dpkg -i ./Eggo/*.deb
    echo "Installation complete."

else
    echo "No .deb file found in the ./Eggo/ directory. Installing file..."
    # download the latest .deb file from the github releases page
    LATEST_DEB_URL=$(curl -s https://api.github.com/repos/pieroproietti/penguins-eggs/releases/latest | grep browser_download_url | grep .deb | cut -d '"' -f 4)
    wget -P ./Eggo/ $LATEST_DEB_URL
    echo "Downloaded the latest .deb file."
    echo "Installing..."
    sudo dpkg -i ./Eggo/*.deb
    echo "Installation complete."
fi
echo "--Installation finished--"
echo "Now you can run 'eggs' from your terminal to start Penguin's Eggs."
echo "Press any key to exit..."
read -n 1 -s
exit 0
