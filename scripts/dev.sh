#!/bin/bash
set -e
set -o pipefail

end="; echo 'Press [Enter] to exit ...'; read -r"

terminator -x "cd $(pwd)/lib/web-redux-core && npm run dev $end"
terminator -x "cd $(pwd)/lib/web-redux-client && npm run dev $end"
terminator -x "cd $(pwd)/lib/web-redux-server && npm run dev $end"

terminator -x "cd $(pwd)/example/common && npm run dev $end"
terminator -x "cd $(pwd)/example/server && npm run dev $end"
terminator -x "cd $(pwd)/example/react-app && npm start $end"
