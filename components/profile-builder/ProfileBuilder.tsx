import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Eye,
  Layers,
  Loader2,
  Palette,
  Save,
  Sparkles,
  X,
  Check,
  Layout,
  Monitor,
  Smartphone,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileBlock, ProfileBlockType, UserRole, Lawyer } from '../../types';
import { useApp } from '../../store/store';
import { getLawyerById, updateLawyerProfileConfig } from '../../services/firebaseService';
import { DraggableGrid } from './DraggableGrid';
import { Toolbox } from './Toolbox';
import { TemplateSelector } from './TemplateSelector';
import { ProfileViewer } from './ProfileViewer';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export const ProfileBuilder: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [lawyerData, setLawyerData] = useState<Lawyer | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showToolbox, setShowToolbox] = useState(true);

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

  const handleAddBlock = (type: ProfileBlockType) => {
    const newBlock: ProfileBlock = {
      id: generateId(),
      type,
      order: blocks.length,
      size: 'medium',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const handleUpdateBlock = (id: string, updates: Partial<ProfileBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Load lawyer profile config on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        console.warn('⚠️ User not logged in, redirecting to login...');
        navigate('/login');
        return;
      }

      if (currentUser.role !== UserRole.LAWYER) {
        console.warn('⚠️ User is not a lawyer, redirecting...');
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
            console.log(`✅ Loaded ${fullLawyerData.profileConfig.length} blocks from profile`);
            setBlocks(fullLawyerData.profileConfig);
          } else {
            console.log('ℹ️ No existing profile config, starting with default blocks');
            setBlocks([
              { id: generateId(), type: ProfileBlockType.TEXT, title: 'Ma Vision', content: 'Je défends vos droits avec passion et détermination...', order: 0, size: 'medium' },
              { id: generateId(), type: ProfileBlockType.MEDIA, content: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', order: 1, size: 'medium' },
              { id: generateId(), type: ProfileBlockType.CONTACT, title: 'Me contacter', order: 2, size: 'small' },
            ]);
          }
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        alert('Erreur lors du chargement du profil. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, navigate]);

  const handleSave = async () => {
    if (!lawyerId) {
      alert('Erreur: Impossible de déterminer votre profil avocat.');
      return;
    }

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
      console.error('❌ Error saving profile:', error);
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-primary-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
              <Palette className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-deep-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary-600" />
                  Éditeur de Profil
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {blocks.length} bloc{blocks.length !== 1 ? 's' : ''} configuré{blocks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <TemplateSelector
                onSelectTemplate={(newBlocks) => {
                  setBlocks(newBlocks);
                }}
                currentBlocks={blocks}
                currentUserEmail={currentUser?.email}
              />
              
              <button
                onClick={() => setShowToolbox(!showToolbox)}
                className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  showToolbox
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                Blocs
              </button>

              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm shadow-lg transition-all ${
                  saveSuccess
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-primary-500/30 hover:shadow-primary-500/40 hover:brightness-110'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Editor Area */}
          <div className={`flex-1 transition-all duration-300 ${showToolbox ? 'lg:mr-[300px]' : ''}`}>
            {/* Empty State */}
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Commencez à créer votre profil
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
                  Ajoutez des blocs depuis le panneau de droite pour construire votre page professionnelle unique.
                </p>
                <button
                  onClick={() => setShowToolbox(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:brightness-110 transition-all"
                >
                  <Layers className="w-5 h-5" />
                  Ajouter un bloc
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <DraggableGrid
                  blocks={blocks}
                  onRemoveBlock={handleRemoveBlock}
                  onUpdateBlock={handleUpdateBlock}
                  lawyerData={lawyerData ? {
                    coordinates: lawyerData.coordinates,
                    location: lawyerData.location
                  } : undefined}
                />
              </DndContext>
            )}
          </div>

          {/* Toolbox Sidebar */}
          {showToolbox && (
            <div className="hidden lg:block fixed right-8 top-24 w-[280px] max-h-[calc(100vh-120px)] overflow-y-auto">
              <Toolbox onAddBlock={handleAddBlock} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Toolbox Button */}
      <button
        onClick={() => setShowToolbox(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-500/40 flex items-center justify-center z-30 hover:brightness-110 transition-all"
      >
        <Layers className="w-6 h-6" />
      </button>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-deep-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-deep-800">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  Aperçu du Profil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Voici comment votre profil apparaîtra aux clients
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Device Toggle */}
                <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-xl p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded-lg transition-all ${
                      previewMode === 'desktop'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded-lg transition-all ${
                      previewMode === 'mobile'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-deep-950 p-8 flex justify-center">
              <div
                className={`bg-white dark:bg-deep-900 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${
                  previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'
                }`}
              >
                {blocks.length === 0 ? (
                  <div className="text-center py-20 px-8">
                    <Layout className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
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
                      onContactClick={() => {
                        alert('💬 Dans la version finale, cela redirigera vers la section de réservation');
                      }}
                      onVideoClick={() => {
                        alert('🎥 Dans la version finale, cela redirigera vers la section de réservation vidéo');
                      }}
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
