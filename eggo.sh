echo "--PENGUIN'S EGGS .deb-based installer(Eggo)--"
echo "By robert19066"
mkdir -p ./Eggo
echo "cheking for .deb file"
# check if in the /Eggo dir is the latest .deb file from https://github.com/pieroproietti/penguins-eggs"
LATEST_DEB_URL=$(curl -s https://api.github.com/repos/pieroproietti/penguins-eggs/releases/latest | grep browser_download_url | grep .deb | cut -d '"' -f 4)
wget -P ./Eggo/ $LATEST_DEB_URL
echo "Downloaded the latest .deb file."
echo "Installing..."
sudo apt install ./Eggo/*.deb
echo "Installation complete."
echo "--Installation finished--"
echo "Now you can run 'eggs' from your terminal to start Penguin's Eggs."
echo "Press any key to exit..."
read -n 1 -s
exit 0
