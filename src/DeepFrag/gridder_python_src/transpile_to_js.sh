# Copyright 2021 Jacob Durrant

# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy
# of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.


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
