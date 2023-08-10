#!/bin/bash

mal_js_json='../netcraft-data/malicious_js.json'
linec=$(wc -l ${mal_js_json})
linec=${linec%$mal_js_json}

# first line is metainformation
random10=$(shuf -i 2-$linec -n 10)

echo $random10

#random10=$(echo $random10 | xargs -n1 | sort | xargs)
#random10=$(echo $random10 | sort -n -t " ")
random10=$(tr '.' '\n' <<<"$random10" | sort -n | paste -sd' ' -)

echo $random10

for num in $random10; do
	echo -ne "$num\t"
	json=$(sed "${num}q;d" $mal_js_json)
	echo $(echo $json | jq -r '.hostname')
done

#  14882	immobilien-management.net
#  27971	wikipedia-4.blogspot.my
#  58381	www.luqmanethiopia.org
#  86116	croopost.blogspot.ca
# 105899	hannahvitashoppe.blogspot.pt
# 110421	aspectrenovations.co.uk
# 134872	mail.elbitsecurity.com
# 140272	phelieunamdinh.com
# 154493	designerfabricsusa.com
# 156716	mail.findtouringdeals.com
#
#  32892	highblood-pressure-risk-factors.blogspot.com.uy
#  53604	jornalofisico.blogspot.ro
#  63653	www.baptemes-air.fr
#  70015	plateforme-mat.fr
#  87093	krikkrikkrik12345.blogspot.hk
#  87514	www.pennytrams.com
# 111354	tutorcell13.blogspot.rs
# 140926	avivabrazil.blogspot.mx
# 147233	themeyergroup.com
# 165078	amazinggraceldn.com
