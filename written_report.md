In the past week I have been working mostely on the backend architecture of the project.

I have 3 node modules:
> server, the biggest module with submodules:
> > Terminal user interface, which has gone through many iterations as I always find out that I have too many reports to manage
> > PostreSQL facing client to connect to the database where I store all of the reports
> > The server itself, which controls the logic of receiving reports, adding directives to the CSP and displaying violations
> client, which in an autonomous way controls the client browser
> mitmproxy facing server I use to inject the csp designed by the server to the clients browser

Overall I believe the work is going at a fine pace, but now I will be heading into some issues:
> the NetCraft dataset is shallow, it contains many websites loading malicious js, but I see that in some cases it lacks hosts providing said js. I will do more testing on that as it may be different for some websites.
> the 40 character sample that is provided in the report is much smaller than I have expected, it can also contain comments, for that I have been thinking whether I should do fetch the documents from the server, but it will run into problems if js is created dynamically
> For both things I have been looking into autonomous solutions to detect malicious js and papers related to that topic, as it seems to be the next thing in line for the project. Also I wonder whether those will be applicable for the 40 char limit of the sample.
