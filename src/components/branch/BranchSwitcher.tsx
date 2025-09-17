import { X, Search, MapPin, Clock, Users, Star, ArrowRight, Building2, Phone } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useBranches } from '@/hooks/useBranches';
import { Branch } from '@/types/branch.types';

interface BranchSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BranchCardProps {
  branch: Branch;
  isActive: boolean;
  isRecent: boolean;
  onSelect: (branchId: string) => void;
  onHover: (branch: Branch | null) => void;
}

const BranchCard: React.FC<BranchCardProps> = ({ 
  branch, 
  isActive, 
  isRecent, 
  onSelect, 
  onHover 
}) => {
  const location = `${branch.address?.city || 'Unknown'}, ${branch.address?.subcounty || ''}, ${branch.ward?.name || ''}`.trim().replace(/,$/, '');
  
  return (
    <div
      className={`
        relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
        ${isActive 
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
        }
      `}
      onClick={() => onSelect(branch._id)}
      onMouseEnter={() => onHover(branch)}
      onMouseLeave={() => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={`Switch to ${branch.name} branch`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(branch._id);
        }
      }}
    >
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {isActive && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
            Current
          </span>
        )}
        {isRecent && !isActive && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Recent
          </span>
        )}
        <div className={`
          w-3 h-3 rounded-full border-2 border-white shadow-sm
          ${branch.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}
        `} />
      </div>

      {/* Branch Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {branch.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {branch.contact?.managerName ? `Manager: ${branch.contact.managerName}` : `${branch.type.charAt(0).toUpperCase() + branch.type.slice(1)} Branch`}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{branch.staffing?.currentStaff || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span className="capitalize">{branch.type}</span>
          </div>
        </div>

        {/* Branch Stats */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {branch.code || branch._id.slice(-8)}
          </div>
          <ArrowRight className={`
            w-4 h-4 transition-all duration-300 
            ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1'}
          `} />
        </div>
      </div>
    </div>
  );
};

const BranchSwitcher: React.FC<BranchSwitcherProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    branches, 
    currentBranch, 
    loading, 
    error, 
    switchBranch,
    canUserAccessBranch,
    canUserSwitchBranches
  } = useBranches();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<Branch | null>(null);
  const [switching, setSwitching] = useState(false);
  const [recentBranches, setRecentBranches] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load recent branches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentBranches') || '[]');
    setRecentBranches(recent);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter branches based on search and permissions
  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    
    return branches.filter(branch => {
      // Check permissions
      if (!canUserAccessBranch(branch._id)) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const location = `${branch.address?.city || ''} ${branch.address?.state || ''} ${branch.address?.country || ''} ${branch.address?.subcounty || ''} ${branch.ward?.name || ''}`.toLowerCase();
        return (
          branch.name.toLowerCase().includes(term) ||
          location.includes(term) ||
          branch.code?.toLowerCase().includes(term) ||
          branch._id.toLowerCase().includes(term) ||
          branch.type.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [branches, searchTerm, canUserAccessBranch]);

  // Separate recent and other branches
  const { recentBranchList, otherBranches } = useMemo(() => {
    const current = currentBranch?._id;
    const recent = filteredBranches.filter(branch => 
      recentBranches.includes(branch._id) && branch._id !== current
    );
    const others = filteredBranches.filter(branch => 
      !recentBranches.includes(branch._id) || branch._id === current
    );

    return {
      recentBranchList: recent,
      otherBranches: others
    };
  }, [filteredBranches, recentBranches, currentBranch]);

  const handleBranchSelect = async (branchId: string) => {
    if (branchId === currentBranch?._id) {
      onClose();
      return;
    }

    // Check if user can switch branches
    if (!canUserSwitchBranches()) {
      console.warn('User does not have permission to switch branches');
      return;
    }

    try {
      setSwitching(true);
      await switchBranch(branchId);
      
      // Update recent branches
      const updated = [branchId, ...recentBranches.filter(id => id !== branchId)].slice(0, 5);
      setRecentBranches(updated);
      localStorage.setItem('recentBranches', JSON.stringify(updated));
      
      onClose();
    } catch (error) {
      console.error('Failed to switch branch:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Switch Branch</h2>
            <p className="text-gray-600 mt-1">
              Select a branch to switch to • Press Ctrl+B to open anytime
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close branch switcher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search branches by name, location, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Branch List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading branches...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg font-medium">Error loading branches</div>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Recent Branches */}
                {recentBranchList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">Recent Branches</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentBranchList.map((branch) => (
                        <BranchCard
                          key={branch._id}
                          branch={branch}
                          isActive={branch._id === currentBranch?._id}
                          isRecent={true}
                          onSelect={handleBranchSelect}
                          onHover={setHoveredBranch}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Branches */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">All Branches</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {otherBranches.length}
                    </span>
                  </div>
                  
                  {otherBranches.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No branches found</div>
                      {searchTerm && (
                        <p className="text-gray-400 mt-2">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherBranches.map((branch) => (
                        <BranchCard
                          key={branch._id}
                          branch={branch}
                          isActive={branch._id === currentBranch?._id}
                          isRecent={false}
                          onSelect={handleBranchSelect}
                          onHover={setHoveredBranch}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Branch Details Sidebar */}
          {hoveredBranch && (
            <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Branch Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{hoveredBranch.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <p className="text-gray-900 font-mono text-sm">{hoveredBranch.code}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    {hoveredBranch.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="text-gray-900 text-sm">
                    <p>{hoveredBranch.address?.street}</p>
                    <p>{hoveredBranch.address?.city}, {hoveredBranch.address?.state} {hoveredBranch.address?.postalCode}</p>
                    <p>{hoveredBranch.address?.subcounty}, {hoveredBranch.ward?.name}</p>
                    <p>{hoveredBranch.address?.country}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <div className="text-gray-900 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{hoveredBranch.contact?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span>{hoveredBranch.contact?.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${hoveredBranch.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : hoveredBranch.status === 'inactive'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-700'
                    }
                  `}>
                    {hoveredBranch.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                  <p className="text-gray-900">
                    {hoveredBranch.staffing?.currentStaff || 0} / {hoveredBranch.staffing?.maxStaff || 'N/A'}
                  </p>
                </div>

                {hoveredBranch.operations?.seatingCapacity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                    <p className="text-gray-900">{hoveredBranch.operations.seatingCapacity}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <p className="text-gray-900">{hoveredBranch.financial?.currency || 'KES'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch ID</label>
                  <p className="text-gray-900 font-mono text-xs break-all">{hoveredBranch._id}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Switching Overlay */}
        {switching && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Switching branches...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchSwitcher;
