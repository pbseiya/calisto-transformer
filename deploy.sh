#!/bin/bash
# Deploy script for seiya-thinkstation

echo "=========================================="
echo "DGA Monitor Deployment"
echo "=========================================="

# Install Python dependencies
echo ""
echo "1. Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment
echo ""
echo "2. Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from template"
    echo "⚠️  Please edit .env with your database credentials"
else
    echo ".env already exists"
fi

# Setup database
echo ""
echo "3. Setting up database..."
python3 setup_db.py

# Install systemd service
echo ""
echo "4. Installing systemd service..."
sudo cp dga-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dga-monitor

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo ""
echo "To start the monitor:"
echo "  sudo systemctl start dga-monitor"
echo ""
echo "To check status:"
echo "  sudo systemctl status dga-monitor"
echo ""
echo "To view logs:"
echo "  journalctl -u dga-monitor -f"
echo ""
echo "To query data:"
echo "  psql -U postgres -d dga_monitor -c 'SELECT * FROM latest_readings;'"
echo "=========================================="
