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
import { Eye, Save, Loader2, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileBlock, ProfileBlockType, UserRole, Lawyer } from '../../types';
import { useApp } from '../../store/store';
import { getLawyerById, updateLawyerProfileConfig } from '../../services/firebaseService';
import { DraggableGrid } from './DraggableGrid';
import { Toolbox } from './Toolbox';
import { TemplateSelector } from './TemplateSelector';
import { ProfileViewer } from './ProfileViewer';
import { LogoBlock } from './blocks/LogoBlock';
import { MapBlock } from './blocks/MapBlock';
import { StatsBlock } from './blocks/StatsBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { CertificationsBlock } from './blocks/CertificationsBlock';
import { SocialBlock } from './blocks/SocialBlock';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export const ProfileBuilder: React.FC = () => {
  const { currentUser, lawyers } = useApp();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [lawyerData, setLawyerData] = useState<Lawyer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      size: 'medium', // Default size
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
      // Check if user is logged in and is a lawyer
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
        // Find the lawyer in the list by email (since login uses email)
        const lawyer = lawyers.find(l => l.email === currentUser.email);
        
        if (!lawyer) {
          console.warn('⚠️ Lawyer profile not found in database');
          // Start with empty blocks if no profile exists
          setBlocks([]);
          setIsLoading(false);
          return;
        }

        setLawyerId(lawyer.id);

        // Load the full lawyer data from Firebase to get profileConfig
        const fullLawyerData = await getLawyerById(lawyer.id);
        
        if (fullLawyerData) {
          setLawyerData(fullLawyerData);
          
          if (fullLawyerData.profileConfig && fullLawyerData.profileConfig.length > 0) {
            // Load existing profile config
            console.log(`✅ Loaded ${fullLawyerData.profileConfig.length} blocks from profile`);
            setBlocks(fullLawyerData.profileConfig);
          } else {
            // Start with default blocks if no profile config exists
            console.log('ℹ️ No existing profile config, starting with default blocks');
            setBlocks([
              { id: generateId(), type: ProfileBlockType.TEXT, title: 'Ma Vision', content: 'Je défends vos droits avec passion...', order: 0, size: 'medium' },
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
  }, [currentUser, lawyers, navigate]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSave = async () => {
    if (!lawyerId) {
      alert('Erreur: Impossible de déterminer votre profil avocat.');
      return;
    }

    setIsSaving(true);
    try {
      // Update order based on current array index
      const blocksWithOrder = blocks.map((block, index) => ({
        ...block,
        order: index
      }));

      await updateLawyerProfileConfig(lawyerId, blocksWithOrder);
      alert('✅ Configuration sauvegardée avec succès !');
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-DEFAULT mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 pt-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-navy dark:text-white">Éditeur de Profil</h1>
            <p className="text-slate-600 dark:text-slate-400">Construisez votre page avocat modulaire.</p>
          </div>
          <div className="flex gap-3">
            <TemplateSelector
              onSelectTemplate={(blocks) => {
                setBlocks(blocks);
                alert(`✅ Template appliqué avec ${blocks.length} bloc(s) !`);
              }}
              currentBlocks={blocks}
              currentUserEmail={currentUser?.email}
            />
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-navy dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-navy dark:bg-brand-DEFAULT text-white rounded-lg hover:bg-navy-light dark:hover:bg-brand-dark font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
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
          </div>
          
          <div className="lg:col-span-1">
            <Toolbox onAddBlock={handleAddBlock} />
          </div>
        </div>
      </div>

      {/* Modal Aperçu */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-white">
                  Aperçu du Profil
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Voici comment votre profil apparaîtra aux clients
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content - Aperçu du profil */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-800">
              {blocks.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-500 dark:text-slate-400">
                    Aucun bloc configuré. Ajoutez des blocs pour voir l'aperçu.
                  </p>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

