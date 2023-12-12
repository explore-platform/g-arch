#!/bin/bash

for (( ; ; ))
do
   echo "looped";
   echo "looped" >> /temp/output_data/testing.txt;
   sleep 2;
done