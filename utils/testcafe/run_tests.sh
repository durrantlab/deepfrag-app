# export URL="http://localhost:8082/"
# export URL="http://0.0.0.0:8000/"
export URL="http://localhost:8081/?test"
# export URL="https://durrantlab.pitt.edu/apps/deepfrag/beta/"

# Combine all the test typescript files
cat main.template.ts | sed "s|URLURL|${URL}|g"> tmp.ts
ls tests/ | grep "\.ts" | grep -v "\.old" | awk '{print "cat ./tests/" $1 " | sed \"s/TITLETITLE/" $1 "/g\" | sed \"s|\\.ts\\\"|\\\"|g\" >> tmp.ts; echo \"\" >> tmp.ts"}' | bash

# Run the tests
testcafe chrome tmp.ts --disable-page-caching
testcafe firefox tmp.ts --disable-page-caching

# Clean up
rm tmp.ts

# Warning
echo "Note: Did not test delete atom."
