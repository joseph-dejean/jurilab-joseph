import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Eye,
  Loader2,
  Palette,
  Save,
  Check,
  Monitor,
  Smartphone,
  X,
  Layout,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileBlock, ProfileBlockType, UserRole, Lawyer } from '../../types';
import { useApp } from '../../store/store';
import { getLawyerById, updateLawyerProfileConfig } from '../../services/firebaseService';

// New V2 components
import { ProfileCanvas } from './Canvas/ProfileCanvas';
import { BlockDock } from './Dock/BlockDock';
import { EditPanel } from './Panel/EditPanel';
import { TemplateSelector } from './TemplateSelector';
import { ProfileViewer } from './ProfileViewer';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export const ProfileBuilderV2: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  
  // State
  const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [lawyerData, setLawyerData] = useState<Lawyer | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Get the currently selected block
  const selectedBlock = selectedBlockId 
    ? blocks.find(b => b.id === selectedBlockId) || null 
    : null;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Add a new block
  const handleAddBlock = (type: ProfileBlockType) => {
    const newBlock: ProfileBlock = {
      id: generateId(),
      type,
      order: blocks.length,
      size: 'medium',
      stylePreset: 'clean',
    };
    
    setBlocks(prev => [...prev, newBlock]);
    
    // Auto-select the new block
    setSelectedBlockId(newBlock.id);
  };

  // Remove a block
  const handleRemoveBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  // Update a block
  const handleUpdateBlock = (id: string, updates: Partial<ProfileBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Select a block
  const handleSelectBlock = (id: string | null) => {
    setSelectedBlockId(id);
  };

  // Close panel
  const handleClosePanel = () => {
    setSelectedBlockId(null);
  };

  // Load lawyer profile config on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      if (currentUser.role !== UserRole.LAWYER) {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        setLawyerId(currentUser.id);

        const fullLawyerData = await getLawyerById(currentUser.id);

        if (fullLawyerData) {
          setLawyerData(fullLawyerData);

          if (fullLawyerData.profileConfig && fullLawyerData.profileConfig.length > 0) {
            // Ensure all blocks have stylePreset
            const blocksWithPreset = fullLawyerData.profileConfig.map(block => ({
              ...block,
              stylePreset: block.stylePreset || 'clean'
            }));
            setBlocks(blocksWithPreset);
          } else {
            // Default blocks for new profiles
            setBlocks([
              { 
                id: generateId(), 
                type: ProfileBlockType.TEXT, 
                title: 'Ma Vision', 
                content: 'Je défends vos droits avec passion et détermination. Mon expertise et mon engagement sont au service de votre réussite.', 
                order: 0, 
                size: 'large',
                stylePreset: 'clean'
              },
              { 
                id: generateId(), 
                type: ProfileBlockType.STATS, 
                content: JSON.stringify({ yearsExperience: 10, casesWon: 150, successRate: 95 }), 
                order: 1, 
                size: 'medium',
                stylePreset: 'primary'
              },
              { 
                id: generateId(), 
                type: ProfileBlockType.CONTACT, 
                title: 'Prendre rendez-vous', 
                order: 2, 
                size: 'small',
                stylePreset: 'clean'
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, navigate]);

  // Save profile
  const handleSave = async () => {
    if (!lawyerId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const blocksWithOrder = blocks.map((block, index) => ({
        ...block,
        order: index
      }));

      await updateLawyerProfileConfig(lawyerId, blocksWithOrder);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-primary-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/30">
              <Palette className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-lg text-deep-600 dark:text-surface-400 font-medium">
            Chargement de votre profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-deep-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-deep-700/50">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-deep-600 dark:text-surface-400" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-deep-900 dark:text-surface-50 flex items-center gap-2.5 font-display">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  Éditeur de Profil
                </h1>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 ml-10">
                  {blocks.length} bloc{blocks.length !== 1 ? 's' : ''} • 
                  {selectedBlockId ? ' 1 sélectionné' : ' Aucun sélectionné'}
                </p>
              </div>
            </div>

            {/* Center - Template Selector */}
            <div className="hidden md:block">
              <TemplateSelector
                onSelectTemplate={(newBlocks) => {
                  setBlocks(newBlocks.map(b => ({ ...b, stylePreset: b.stylePreset || 'clean' })));
                  setSelectedBlockId(null);
                }}
                currentBlocks={blocks}
                currentUserEmail={currentUser?.email}
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-deep-800 text-deep-700 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-deep-700 font-medium text-sm transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm 
                  shadow-lg transition-all duration-300
                  ${saveSuccess
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-primary-500/30 hover:shadow-primary-500/50 hover:brightness-110'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Sauvegarde...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Sauvegardé !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <ProfileCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onUpdateBlock={handleUpdateBlock}
            lawyerData={lawyerData ? {
              coordinates: lawyerData.coordinates,
              location: lawyerData.location
            } : undefined}
          />
        </DndContext>
      </main>

      {/* Bottom Block Dock */}
      <BlockDock onAddBlock={handleAddBlock} disabled={isSaving} />

      {/* Edit Panel (slides in from right) */}
      <EditPanel
        block={selectedBlock}
        isOpen={selectedBlockId !== null}
        onClose={handleClosePanel}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleRemoveBlock}
      />

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-deep-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-deep-700 bg-surface-50 dark:bg-deep-800">
              <div>
                <h2 className="text-lg font-bold text-deep-900 dark:text-surface-50 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  Aperçu du Profil
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Voici comment votre profil apparaîtra aux clients
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Device Toggle */}
                <div className="flex items-center bg-surface-200 dark:bg-deep-700 rounded-xl p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2.5 rounded-lg transition-all ${
                      previewMode === 'desktop'
                        ? 'bg-white dark:bg-deep-600 shadow-sm text-primary-600'
                        : 'text-surface-500 hover:text-deep-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2.5 rounded-lg transition-all ${
                      previewMode === 'mobile'
                        ? 'bg-white dark:bg-deep-600 shadow-sm text-primary-600'
                        : 'text-surface-500 hover:text-deep-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-surface-200 dark:hover:bg-deep-700 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-surface-100 dark:bg-deep-950 p-8 flex justify-center">
              <div
                className={`bg-white dark:bg-deep-900 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${
                  previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'
                }`}
              >
                {blocks.length === 0 ? (
                  <div className="text-center py-20 px-8">
                    <Layout className="w-12 h-12 text-surface-300 dark:text-deep-600 mx-auto mb-4" />
                    <p className="text-surface-500 dark:text-surface-400">
                      Aucun bloc configuré. Ajoutez des blocs pour voir l'aperçu.
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <ProfileViewer
                      blocks={blocks}
                      lawyerData={lawyerData ? {
                        coordinates: lawyerData.coordinates,
                        location: lawyerData.location
                      } : undefined}
                      onContactClick={() => {}}
                      onVideoClick={() => {}}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBuilderV2;
