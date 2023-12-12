# Testing the CreateFits function

## Context

Run all the following commands from the root of the project 

## Run the API

```bash
docker-compose up science-api
```

## Run test with csv of ids

```bash
./_tests/science-api/create_fits_file_ids.sh
```


## Run test with csv of star names

```bash
./_tests/science-api/create_fits_file_names.sh
```