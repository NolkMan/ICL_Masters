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
	host,
	sum(total) as total, 
	sum(policy) as justPolicy ,
	(sum(policy)*100) / sum(total) as percentage
	from (
		select 
			length(report::varchar) as total, 
			length(report->>'original-policy'::varchar) as policy,
			host
			from cspro_reports
	) as sub
	group by host
;

select
	distinct host
	from cspro_reports
;

select 
	host, 
	count(host) 
	from cspro_reports 
	where report->>'blocked-uri' = 'eval' 
	group by host
;
