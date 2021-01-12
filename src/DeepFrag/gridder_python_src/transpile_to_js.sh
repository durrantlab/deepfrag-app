# You must use a python encironment with transcrypt installed.
source activate Python36

# Clean up previous compiles
rm __target__/*

# Transpile from python to javascript.
transcrypt --ecom make_grid.py

# Copy index.html to the compiled directory too (for testing).
cp index.html __target__/

# Run a local server to test in the browser.
# cd __target__/
# python2 -m SimpleHTTPServer 8000

# Could also automatically copy new compiled version to location that web app
# expects.
# cp __target__/* ../DeepFrag/gridder/
