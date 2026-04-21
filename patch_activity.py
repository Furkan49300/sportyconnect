with open("frontend/src/pages/ActivityDetail.js", "r") as f:
    c = f.read()
if "import { BACKEND_URL } from '../lib/api';" not in c:
    c = c.replace("import api from '../lib/api';", "import api, { BACKEND_URL } from '../lib/api';")

c = c.replace("process.env.REACT_APP_BACKEND_URL", "BACKEND_URL")
with open("frontend/src/pages/ActivityDetail.js", "w") as f:
    f.write(c)
