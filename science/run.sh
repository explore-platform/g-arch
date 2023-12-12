#!/bin/sh
export local=`pwd`
export data=${local}"/data/MARCS"
awk -F"=" -v newval="=$data" '/gaia.matisse.data_dir/{$2=newval;print;next}1' "${local}/conf/example.properties" > "${local}/conf/example.tmp"
mv ${local}/conf/example.tmp ${local}/conf/example.properties
cd ${local}/dist
java -jar -Xmx20000m MatisseV4.jar ../conf/example.properties
