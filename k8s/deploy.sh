#!/bin/bash

# Deploy HotelZed application to Kubernetes

echo "Creating namespace..."
kubectl apply -f namespace.yaml

echo "Creating secrets..."
kubectl apply -f secrets.yaml

echo "Creating MongoDB PVC..."
kubectl apply -f mongodb-pvc.yaml

echo "Deploying MongoDB..."
kubectl apply -f mongodb-deployment.yaml

echo "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n hotelzed --timeout=120s

echo "Deploying Backend..."
kubectl apply -f backend-deployment.yaml

echo "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n hotelzed --timeout=120s

echo "Deploying Frontend..."
kubectl apply -f frontend-deployment.yaml

echo "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n hotelzed --timeout=120s

echo "Creating Ingress..."
kubectl apply -f ingress.yaml

echo "Setting up Horizontal Pod Autoscalers..."
kubectl apply -f horizontal-pod-autoscaler.yaml

echo "Deployment complete!"
echo ""
echo "Application status:"
kubectl get all -n hotelzed
echo ""
echo "Access the application at: http://hotelzed.local"
echo "Make sure to add '127.0.0.1 hotelzed.local' to your /etc/hosts file"