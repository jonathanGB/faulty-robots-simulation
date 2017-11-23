case "$OSTYPE" in
  darwin*)  echo "OSX" && bin/mac_server ;; 
  linux*)   echo "LINUX" && bin/linux_server ;;
  msys*)    echo "WINDOWS" && bin/windows_server.exe ;;
  *)        echo "unknown: $OSTYPE" ;;
esac