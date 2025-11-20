import { ProfileBlock, ProfileBlockType, ProfileBlockSize } from '../types';

export interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  blocks: ProfileBlock[];
  isDefault?: boolean; // Templates prédéfinis
  createdBy?: string; // Email de l'utilisateur qui a créé le template
  createdAt?: number; // Timestamp
}

// Templates prédéfinis
export const DEFAULT_TEMPLATES: ProfileTemplate[] = [
  {
    id: 'template-1',
    name: 'Classique',
    description: 'Layout équilibré avec texte, média et contact',
    isDefault: true,
    blocks: [
      {
        id: 't1-b1',
        type: ProfileBlockType.TEXT,
        title: 'Ma Vision',
        content: 'Je défends vos droits avec passion et expertise. Mon approche personnalisée garantit un accompagnement de qualité pour chaque dossier.',
        order: 0,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't1-b2',
        type: ProfileBlockType.MEDIA,
        content: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
        order: 1,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't1-b3',
        type: ProfileBlockType.CONTACT,
        title: 'Me contacter',
        order: 2,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't1-b4',
        type: ProfileBlockType.STATS,
        title: 'Mes Statistiques',
        content: JSON.stringify({ years: '15', cases: '500+', success: '95%' }),
        order: 3,
        size: 'full' as ProfileBlockSize,
      },
    ],
  },
  {
    id: 'template-2',
    name: 'Professionnel',
    description: 'Mise en avant des certifications et de l\'expérience',
    isDefault: true,
    blocks: [
      {
        id: 't2-b1',
        type: ProfileBlockType.LOGO,
        content: '',
        order: 0,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't2-b2',
        type: ProfileBlockType.TEXT,
        title: 'À propos',
        content: 'Avocat avec plus de 15 ans d\'expérience, spécialisé dans le droit des affaires et le droit commercial.',
        order: 1,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't2-b3',
        type: ProfileBlockType.CERTIFICATIONS,
        title: 'Certifications',
        content: JSON.stringify(['Barreau de Paris', 'Certification Droit des Affaires', 'Master en Droit Commercial']),
        order: 2,
        size: 'tall' as ProfileBlockSize,
      },
      {
        id: 't2-b4',
        type: ProfileBlockType.STATS,
        title: 'Expérience',
        content: JSON.stringify({ years: '15', cases: '500+', success: '95%' }),
        order: 3,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't2-b5',
        type: ProfileBlockType.MAP,
        content: '',
        order: 4,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't2-b6',
        type: ProfileBlockType.SOCIAL,
        title: 'Réseaux sociaux',
        content: JSON.stringify({ linkedin: '', facebook: '', twitter: '', instagram: '', website: '' }),
        order: 5,
        size: 'small' as ProfileBlockSize,
      },
    ],
  },
  {
    id: 'template-3',
    name: 'Moderne',
    description: 'Design moderne avec vidéo et témoignages',
    isDefault: true,
    blocks: [
      {
        id: 't3-b1',
        type: ProfileBlockType.MEDIA,
        content: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
        order: 0,
        size: 'hero' as ProfileBlockSize,
      },
      {
        id: 't3-b2',
        type: ProfileBlockType.VIDEO,
        title: 'Présentation vidéo',
        content: '',
        order: 1,
        size: 'large' as ProfileBlockSize,
      },
      {
        id: 't3-b3',
        type: ProfileBlockType.TEXT,
        title: 'Mon Approche',
        content: 'Une approche moderne et innovante du droit, adaptée aux enjeux contemporains.',
        order: 2,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't3-b4',
        type: ProfileBlockType.TESTIMONIALS,
        title: 'Témoignages',
        content: JSON.stringify({
          text: 'Excellent avocat, très professionnel et à l\'écoute. Je recommande vivement !',
          author: 'Marie D.',
          rating: 5,
        }),
        order: 3,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't3-b5',
        type: ProfileBlockType.CONTACT,
        title: 'Prendre rendez-vous',
        order: 4,
        size: 'small' as ProfileBlockSize,
      },
    ],
  },
  {
    id: 'template-4',
    name: 'Équipe',
    description: 'Mise en avant de l\'équipe et des collaborateurs',
    isDefault: true,
    blocks: [
      {
        id: 't4-b1',
        type: ProfileBlockType.LOGO,
        content: '',
        order: 0,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't4-b2',
        type: ProfileBlockType.TEXT,
        title: 'Notre Cabinet',
        content: 'Un cabinet d\'avocats expérimenté, composé d\'une équipe pluridisciplinaire au service de vos intérêts.',
        order: 1,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't4-b3',
        type: ProfileBlockType.COLLABORATORS,
        title: 'Notre Équipe',
        content: JSON.stringify([]),
        order: 2,
        size: 'large' as ProfileBlockSize,
      },
      {
        id: 't4-b4',
        type: ProfileBlockType.STATS,
        title: 'Notre Expertise',
        content: JSON.stringify({ years: '20', cases: '1000+', success: '98%' }),
        order: 3,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't4-b5',
        type: ProfileBlockType.CERTIFICATIONS,
        title: 'Certifications',
        content: JSON.stringify(['Barreau de Paris', 'Certification Droit des Affaires']),
        order: 4,
        size: 'tall' as ProfileBlockSize,
      },
      {
        id: 't4-b6',
        type: ProfileBlockType.MAP,
        content: '',
        order: 5,
        size: 'medium' as ProfileBlockSize,
      },
    ],
  },
  {
    id: 'template-5',
    name: 'Complet',
    description: 'Profil complet avec tous les éléments',
    isDefault: true,
    blocks: [
      {
        id: 't5-b1',
        type: ProfileBlockType.LOGO,
        content: '',
        order: 0,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't5-b2',
        type: ProfileBlockType.TEXT,
        title: 'Bienvenue',
        content: 'Avocat passionné et dévoué, je mets mon expertise à votre service pour défendre vos droits et vos intérêts.',
        order: 1,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't5-b3',
        type: ProfileBlockType.STATS,
        title: 'Mes Statistiques',
        content: JSON.stringify({ years: '12', cases: '350+', success: '92%' }),
        order: 2,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't5-b4',
        type: ProfileBlockType.MEDIA,
        content: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
        order: 3,
        size: 'large' as ProfileBlockSize,
      },
      {
        id: 't5-b5',
        type: ProfileBlockType.CERTIFICATIONS,
        title: 'Certifications',
        content: JSON.stringify(['Barreau de Paris', 'Certification Droit des Affaires']),
        order: 4,
        size: 'tall' as ProfileBlockSize,
      },
      {
        id: 't5-b6',
        type: ProfileBlockType.TESTIMONIALS,
        title: 'Avis Clients',
        content: JSON.stringify({
          text: 'Professionnel et efficace. Je recommande sans hésitation !',
          author: 'Jean P.',
          rating: 5,
        }),
        order: 5,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't5-b7',
        type: ProfileBlockType.COLLABORATORS,
        title: 'Équipe',
        content: JSON.stringify([]),
        order: 6,
        size: 'wide' as ProfileBlockSize,
      },
      {
        id: 't5-b8',
        type: ProfileBlockType.MAP,
        content: '',
        order: 7,
        size: 'medium' as ProfileBlockSize,
      },
      {
        id: 't5-b9',
        type: ProfileBlockType.SOCIAL,
        title: 'Suivez-nous',
        content: JSON.stringify({ linkedin: '', facebook: '', twitter: '', instagram: '', website: '' }),
        order: 8,
        size: 'small' as ProfileBlockSize,
      },
      {
        id: 't5-b10',
        type: ProfileBlockType.CONTACT,
        title: 'Contactez-moi',
        order: 9,
        size: 'small' as ProfileBlockSize,
      },
    ],
  },
];

