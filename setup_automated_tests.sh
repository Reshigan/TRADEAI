#!/bin/bash
# Setup automated daily regression tests

# Add cron job to run tests daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd /workspace/project/TRADEAI && bash run_regression_tests.sh >> /var/log/tradeai_regression.log 2>&1") | crontab -

echo "✅ Automated regression tests scheduled for 2 AM daily"
echo "View logs: tail -f /var/log/tradeai_regression.log"
