with open("frontend/src/pages/Landing.js", "r") as f:
    c = f.read()
c = c.replace("process.env.REACT_APP_BACKEND_URL", "BACKEND_URL")
with open("frontend/src/pages/Landing.js", "w") as f:
    f.write(c)
