# export URL="http://localhost:8081/?test"
export URL="https://durrantlab.pitt.edu/deepfrag?test"
# export URL="http://localhost:8080/?test"
# export URL="https://durrantlab.pitt.edu/apps/deepfrag/app/beta/?test"

# Combine all the test typescript files
cat main.template.ts | sed "s|URLURL|${URL}|g"> tmp.ts
ls tests/ | grep "\.ts" | grep -v "\.old" | awk '{print "cat ./tests/" $1 " | sed \"s/TITLETITLE/" $1 "/g\" | sed \"s|\\.ts\\\"|\\\"|g\" >> tmp.ts; echo \"\" >> tmp.ts"}' | bash

export CHROME="chrome"
# export CHROME="chrome:headless"
export FIREFOX="firefox"
# export FIREFOX="firefox:headless"

# Run the tests
testcafe "${CHROME}" --debug-on-fail -c 4 tmp.ts --disable-page-caching  # --speed 0.25
testcafe "${FIREFOX}" --debug-on-fail -c 4 tmp.ts --disable-page-caching

# Clean up
rm tmp.ts

# Warning
echo "Note: Did not test delete atom."
