FROM debian:bookworm-slim

# Set minimum required variables
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl \
	gnupg2 \
	logrotate \
	&& rm -rf /var/lib/apt/lists/*

# Install Nginx & ModSecurity dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
	nginx \
	libnginx-mod-http-modsecurity \
	modsecurity-crs \
	&& rm -rf /var/lib/apt/lists/*
# Modify IncludeOptional to Include in ModSecurity rules
RUN sed -i 's/IncludeOptional/Include/g' /usr/share/modsecurity-crs/owasp-crs.load

RUN rm -rf /usr/share/modsecurity-crs/owasp-crs.load


RUN apt-get update && \
    apt-get install -y certbot python3-certbot-nginx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Copy basic ModSecurity configuration then copy the custom ModSecurity rules
COPY modsecurity/ /etc/modsecurity/

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN mkdir -p /var/cache/modsecurity \
 && chown -R www-data:www-data /var/cache/modsecurity


# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Expose port 80
EXPOSE 80
EXPOSE 443

# Set the entrypoint to the custom script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
