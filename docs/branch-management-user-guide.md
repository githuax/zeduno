# Branch Management User Guide

## Overview

The Branch Management system allows you to create, manage, and operate multiple restaurant locations within a single tenant account. This comprehensive system supports hierarchical branch structures, individual branch configurations, and centralized management capabilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Branch Dashboard Overview](#branch-dashboard-overview)
3. [Creating Branches](#creating-branches)
4. [Managing Branch Information](#managing-branch-information)
5. [Branch Switching](#branch-switching)
6. [Understanding Branch Types](#understanding-branch-types)
7. [Branch Hierarchy](#branch-hierarchy)
8. [Metrics and Analytics](#metrics-and-analytics)
9. [User Assignments](#user-assignments)
10. [Common Workflows](#common-workflows)
11. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Active tenant account with branch management enabled
- User account with appropriate permissions:
  - **Admin/Superadmin**: Full branch management access
  - **Manager**: Access to assigned branches only
  - **Staff**: View access to assigned branches only

### Accessing Branch Management

1. Log into your Dine Serve Hub account
2. Navigate to **Branch Management** from the main menu
3. The dashboard will display all branches you have access to

## Branch Dashboard Overview

The Branch Management dashboard provides a comprehensive view of your branch network:

### Main Features

- **Branch List/Grid View**: Toggle between table and card layouts
- **Search and Filtering**: Find branches by name, code, location, or manager
- **Bulk Operations**: Manage multiple branches simultaneously
- **Real-time Updates**: Auto-refresh capability with manual refresh option
- **Import/Export**: Bulk data management capabilities

### Dashboard Elements

#### Header Section
- **Branch Count**: Total number of branches
- **Auto-refresh Toggle**: Enable/disable automatic data updates
- **Add Branch Button**: Create new branches (Admin only)
- **Last Updated**: Timestamp of last data refresh

#### Search and Filter Bar
- **Search Field**: Search across branch name, code, email, address, and manager
- **View Toggle**: Switch between table and grid views
- **Filter Button**: Access advanced filtering options
- **Actions Menu**: Bulk operations and import/export functions

#### Advanced Filters
- **Status Filter**: Active, Inactive, Suspended
- **Type Filter**: Main Branch, Branch, Franchise
- **Clear Filters**: Reset all applied filters

## Creating Branches

### Step-by-Step Branch Creation

1. **Access Creation Wizard**
   - Click **Add Branch** from the dashboard
   - The creation wizard will open with 6 steps

2. **Step 1: Basic Information**
   - **Branch Name**: Unique identifier for the branch
   - **Branch Type**: Select from Main, Branch, or Franchise
   - **Parent Branch**: Choose parent (if creating a sub-branch)
   - **Branch Code**: Auto-generated or custom code

3. **Step 2: Address & Contact**
   - **Street Address**: Complete street address
   - **City, State, Postal Code**: Location details
   - **Country**: Select country
   - **Coordinates**: Optional GPS coordinates
   - **Phone**: Primary contact number
   - **Email**: Branch email address
   - **Manager**: Assign branch manager

4. **Step 3: Operations**
   - **Operating Hours**: Open and close times
   - **Timezone**: Branch timezone
   - **Days Open**: Select operating days
   - **Seating Capacity**: Number of seats (optional)
   - **Delivery Radius**: Delivery coverage (optional)

5. **Step 4: Financial Settings**
   - **Currency**: Base currency for the branch
   - **Tax Rate**: Local tax percentage
   - **Service Charge**: Optional service charge rate
   - **Tip Enabled**: Allow customer tips
   - **Payment Methods**: Accepted payment types

6. **Step 5: Additional Settings**
   - **Inventory Tracking**: Enable inventory management
   - **Staff Settings**: Maximum staff and available roles
   - **Online Ordering**: Enable online order acceptance
   - **Order Prefix**: Custom order numbering

7. **Step 6: Review & Create**
   - Review all settings
   - Make final adjustments
   - Click **Create Branch** to complete

### Branch Creation Tips

- **Naming Convention**: Use consistent naming for easy identification
- **Code Generation**: Codes are auto-generated but can be customized
- **Parent Branches**: Carefully consider hierarchy for reporting
- **Required Fields**: All mandatory fields must be completed

## Managing Branch Information

### Editing Branch Details

1. **Access Edit Mode**
   - From branch list, click the **Edit** action
   - Or click branch card and select **Edit Branch**

2. **Modify Settings**
   - Update any branch information
   - Changes are validated in real-time
   - Required fields are clearly marked

3. **Save Changes**
   - Review modifications
   - Click **Save** to apply changes
   - System validates all updates

### Branch Status Management

#### Status Types
- **Active**: Branch is fully operational
- **Inactive**: Temporarily closed or non-operational
- **Suspended**: Operations suspended due to issues

#### Changing Status
1. Select branch from list
2. Click **Actions** → **Change Status**
3. Select new status
4. Confirm changes

### Branch Cloning

Clone existing branches to quickly create similar locations:

1. **Select Source Branch**
   - Choose the branch to clone
   - Click **Actions** → **Clone Branch**

2. **Modify Clone Data**
   - Update branch name and location
   - Adjust settings as needed
   - All operational settings are copied

3. **Create Clone**
   - Review cloned settings
   - Click **Create Clone**
   - New branch inherits all configurations

## Branch Switching

### For Multi-Branch Users

Users assigned to multiple branches can switch their active context:

1. **Access Branch Switcher**
   - Click current branch name in header
   - Or use **Switch Branch** from user menu

2. **Select New Branch**
   - Choose from assigned branches
   - System updates context immediately

3. **Context Changes**
   - Orders, menus, and data switch to new branch
   - Permissions remain consistent
   - Dashboard updates automatically

### Switching Capabilities

- **Admins**: Can switch to any branch
- **Multi-branch Staff**: Switch between assigned branches
- **Single-branch Staff**: No switching capability
- **Managers**: Switch within managed branches

## Understanding Branch Types

### Main Branch
- **Purpose**: Primary company location
- **Characteristics**: 
  - Central hub for operations
  - Can have unlimited sub-branches
  - Full administrative access
  - Master menu and settings

### Branch
- **Purpose**: Standard company-owned locations
- **Characteristics**:
  - Inherits settings from parent
  - Can have customized pricing
  - Managed by branch managers
  - Standard operational features

### Franchise
- **Purpose**: Partner-operated locations
- **Characteristics**:
  - Independent operational control
  - Brand consistency requirements
  - Limited central management
  - Custom pricing flexibility

## Branch Hierarchy

### Understanding the Structure

The branch hierarchy represents parent-child relationships:

```
Main Branch (HQ)
├── Branch A (Downtown)
│   ├── Branch A1 (Mall Location)
│   └── Branch A2 (Airport)
├── Branch B (Uptown)
└── Franchise C (Partner Location)
```

### Hierarchy Benefits

1. **Reporting**: Consolidated metrics by region
2. **Menu Management**: Cascade settings to children
3. **User Access**: Hierarchical permission structure
4. **Pricing**: Inherit and customize pricing models

### Managing Hierarchy

1. **View Hierarchy**
   - Access **Branch Hierarchy** tab
   - Expand/collapse branch trees
   - Click branches for details

2. **Modify Relationships**
   - Edit branch to change parent
   - Drag and drop in hierarchy view
   - Confirm structural changes

## Metrics and Analytics

### Branch Performance Dashboard

Each branch displays key performance indicators:

#### Revenue Metrics
- **Total Revenue**: Cumulative sales
- **Average Order Value**: Revenue per transaction
- **Daily/Weekly/Monthly Trends**: Time-based analysis

#### Operational Metrics
- **Total Orders**: Number of transactions
- **Order Completion Rate**: Fulfillment efficiency
- **Peak Hours**: Busy period analysis

#### Staff Metrics
- **Current Staff**: Active employees
- **Staff Utilization**: Efficiency measurements
- **Role Distribution**: Staff by position

### Consolidated Reporting

View metrics across all branches:

1. **Access Consolidated View**
   - Click **Consolidated Metrics**
   - Select date range
   - View comparative analysis

2. **Report Components**
   - Branch-by-branch comparison
   - Total network performance
   - Trend analysis
   - Performance rankings

### Exporting Reports

1. **Select Time Period**
   - Choose start and end dates
   - Apply branch filters

2. **Export Options**
   - PDF summary reports
   - CSV data exports
   - Excel formatted files

## User Assignments

### Assigning Staff to Branches

1. **Access User Management**
   - From branch view, click **Manage Users**
   - Or use **Actions** → **Assign Users**

2. **Add Users**
   - Search available users
   - Select user(s) to assign
   - Choose branch role
   - Confirm assignments

3. **Role Types**
   - **Branch Manager**: Full branch access
   - **Branch Staff**: Operational access
   - **Multi-Branch**: Access multiple locations

### Managing User Access

#### Permissions by Role
- **Admin**: All branches, full control
- **Manager**: Assigned branches, management functions
- **Staff**: Assigned branches, operational tasks
- **Viewer**: Read-only access

#### Removing Access
1. Select branch
2. Click **Manage Users**
3. Remove user from branch
4. Confirm removal

## Common Workflows

### Daily Operations Workflow

1. **Morning Setup**
   - Switch to appropriate branch
   - Check overnight orders
   - Review staff schedule
   - Verify inventory levels

2. **Service Period**
   - Monitor order flow
   - Track performance metrics
   - Manage staff assignments
   - Handle customer inquiries

3. **End of Day**
   - Process final orders
   - Review daily metrics
   - Update inventory
   - Prepare reports

### Weekly Management Workflow

1. **Performance Review**
   - Analyze weekly metrics
   - Compare branch performance
   - Identify improvement areas
   - Plan staff schedules

2. **Inventory Management**
   - Review stock levels
   - Update menu availability
   - Plan procurement
   - Adjust pricing if needed

3. **Staff Management**
   - Review staff performance
   - Adjust assignments
   - Plan training sessions
   - Update contact information

### Monthly Administrative Tasks

1. **Strategic Review**
   - Analyze monthly trends
   - Review branch profitability
   - Plan expansion or changes
   - Update operational procedures

2. **Data Maintenance**
   - Clean up inactive data
   - Update branch information
   - Review user access
   - Archive old reports

## Troubleshooting

### Common Issues and Solutions

#### Cannot Create Branch
**Problem**: "Branch quota exceeded" error
**Solution**: 
- Check tenant branch limit
- Contact administrator to increase quota
- Deactivate unused branches

#### Branch Not Visible
**Problem**: Branch doesn't appear in list
**Solution**:
- Check user permissions
- Verify branch status (active/inactive)
- Refresh browser cache
- Contact administrator

#### Cannot Switch Branches
**Problem**: Branch switching option unavailable
**Solution**:
- Verify assignment to multiple branches
- Check user role permissions
- Contact branch manager for access

#### Performance Issues
**Problem**: Slow loading or timeouts
**Solution**:
- Check internet connection
- Clear browser cache
- Try different browser
- Report to system administrator

#### Data Synchronization Issues
**Problem**: Information not updating
**Solution**:
- Use manual refresh button
- Check auto-refresh settings
- Verify permissions
- Contact technical support

### Getting Help

#### Contact Information
- **Technical Support**: support@dineservehub.com
- **User Documentation**: [Documentation Portal]
- **Video Tutorials**: [Training Center]
- **Community Forum**: [User Community]

#### Self-Help Resources
- Built-in help tooltips
- Interactive tutorials
- Keyboard shortcuts guide
- FAQ section

### Performance Optimization Tips

1. **Use Filters**: Narrow down branch lists for faster loading
2. **Regular Cleanup**: Remove inactive branches and users
3. **Batch Operations**: Use bulk actions for efficiency
4. **Scheduled Reports**: Set up automated reporting
5. **Browser Optimization**: Clear cache regularly

### Best Practices

1. **Naming Conventions**: Use consistent, descriptive branch names
2. **Regular Updates**: Keep branch information current
3. **Permission Management**: Regularly review user access
4. **Data Backup**: Export important data regularly
5. **Training**: Ensure staff understand the system

## Conclusion

The Branch Management system provides comprehensive tools for managing multi-location restaurant operations. By following this guide, you can effectively create, manage, and optimize your branch network for maximum operational efficiency.

For additional support or advanced configuration needs, please contact your system administrator or technical support team.

---
*Last Updated: January 2025*
*Version: 2.0*