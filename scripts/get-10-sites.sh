#!/bin/bash

get_random () {
	local v=$RANDOM
	if (( $v > 10000 )) ; then
		get_random
	else
		echo $v
	fi
}

list=""

for i in {1..10}; do
	list="$list $(get_random)"
done

list=$(echo $list | xargs -n1 | sort | xargs)

for num in $list; do
	echo $num $(sed "${num}q;d" '../netcraft-data/just-top-1M-sites.tsv')
done

# 878  https://codepen.io
# 2589 https://www.pcworld.com
# 2650 https://computingforgeeks.com
# 3302 https://www.scribbr.com/
# 3397 https://cafe.naver.com
# 4642 https://www.libertatea.ro
# 5463 https://www.purolator.com
# 5524 https://www.flashscore.es
# 5686 https://quran.com
# 7153 https://www.professormesser.com
