select 
	host,report ->> 'violated-directive' as viol , count(*)
	from cspro_reports 
	where 
--	host = 'computingforgeeks.com' 
--	and (
		report ->> 'violated-directive' = 'script-src-elem' or 
		report ->> 'violated-directive' = 'script-src-attr' or
		report ->> 'violated-directive' = 'require-trusted-types-for' or
		report ->> 'violated-directive' = 'frame-src' or
		report ->> 'violated-directive' = 'upgrade-insecure-requests'
--	)
	group by host, viol
	order by host, viol
;

select 
	sum(total) as total, 
	sum(policy) as justPolicy 
	from (
		select 
			length(report::varchar) as total, 
			length(report->>'original-policy'::varchar) as policy 
			from cspro_reports where host = 'www.caixabank.es'
	) as sub
;
