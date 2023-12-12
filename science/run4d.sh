#!/bin/sh
export local=`pwd`
export data=${local}"/data/MARCS"
awk -F"=" -v newval="=$data" '/gaia.matisse.data_dir/{$2=newval;print;next}1' "${local}/conf/exampleOnly4d.properties" > "${local}/conf/example.tmp"
mv ${local}/conf/example.tmp ${local}/conf/exampleOnly4d.properties
cd ${local}/dist
java -jar -Xmx5000m MatisseV4.jar ../conf/exampleOnly4d.properties
