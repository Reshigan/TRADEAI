#!/bin/bash

echo "=== TRADEAI Deployment Diagnostics ==="
echo "Date: $(date)"
echo "Server: $(hostname -I | awk '{print $1}')"
echo

echo "=== Docker Status ==="
if command -v docker &> /dev/null; then
    echo "Docker version: $(docker --version)"
    echo "Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version 2>/dev/null)"
    echo
    
    echo "=== Running Containers ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    
    echo "=== All Containers (including stopped) ==="
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    echo
    
    echo "=== Docker Logs (last 20 lines each) ==="
    for container in $(docker ps -q); do
        name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
        echo "--- Logs for $name ---"
        docker logs --tail 20 $container 2>&1
        echo
    done
else
    echo "Docker not installed"
fi

echo "=== Nginx Status ==="
if systemctl is-active --quiet nginx; then
    echo "Nginx is running"
    echo "Nginx config test:"
    nginx -t 2>&1
    echo
    echo "Nginx processes:"
    ps aux | grep nginx | grep -v grep
else
    echo "Nginx is not running"
fi

echo "=== Port Status ==="
echo "Listening ports:"
netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|5000|8000|27017|6379)' || ss -tlnp | grep -E ':(80|443|3000|5000|8000|27017|6379)'

echo
echo "=== File System Check ==="
echo "TRADEAI directory:"
ls -la /opt/tradeai/ 2>/dev/null || echo "Directory /opt/tradeai/ not found"

echo
echo "Nginx web root:"
ls -la /var/www/html/ 2>/dev/null || echo "Directory /var/www/html/ not found"

echo
echo "=== SSL Certificate Status ==="
if [ -f /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem ]; then
    echo "SSL certificate exists"
    openssl x509 -in /etc/letsencrypt/live/tradeai.gonxt.tech/fullchain.pem -text -noout | grep -E "(Subject:|Not After)"
else
    echo "SSL certificate not found"
fi

echo
echo "=== System Resources ==="
echo "Memory usage:"
free -h

echo
echo "Disk usage:"
df -h /

echo
echo "=== Recent System Logs ==="
echo "Last 10 system log entries:"
journalctl --no-pager -n 10 2>/dev/null || tail -10 /var/log/syslog 2>/dev/null || echo "Cannot access system logs"

echo
echo "=== Environment Check ==="
if [ -f /opt/tradeai/.env ]; then
    echo "Environment file exists"
    echo "Environment variables (sensitive data hidden):"
    grep -v -E "(PASSWORD|SECRET|KEY|TOKEN)" /opt/tradeai/.env 2>/dev/null || echo "Cannot read environment file"
else
    echo "Environment file not found"
fi

echo
echo "=== API Health Check ==="
echo "Testing API endpoints:"
curl -k -s -o /dev/null -w "API Health: %{http_code}\n" https://tradeai.gonxt.tech/api/v1/health 2>/dev/null || echo "API Health: Failed to connect"
curl -k -s -o /dev/null -w "API Status: %{http_code}\n" https://tradeai.gonxt.tech/api/v1/status 2>/dev/null || echo "API Status: Failed to connect"

echo
echo "=== Diagnostics Complete ==="