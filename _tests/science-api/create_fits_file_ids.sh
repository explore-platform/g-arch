#!/bin/bash
curl --location --request POST 'http://localhost:3040/create_fits' \
--form "file=@\"$PWD/science-api/scripts/test_id.csv\""