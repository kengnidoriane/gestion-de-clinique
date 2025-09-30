import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Styled from 'styled-components';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import axiosInstance from '../config/axiosConfig';
import { API_BASE } from '../../composants/config/apiconfig';
import '../../styles/calendar.css';
import Barrehorizontal1 from '../../composants/barrehorizontal1';
import imgprofil from '../../assets/photoDoc.png';
import '../../styles/Zonedaffichage.css';

const SousDiv1Style = Styled.div`
    width: 95%;
`;

const Span1 = Styled.span`
    cursor: pointer;
`;

const CalendarContainer = Styled.div`
    width: 100%;
    height: 85vh;
    padding-bottom: 25px;
    margin-top: -30px;
`;

const Calendar = () => {
    const idUser = localStorage.getItem('id');
    const [nomprofil, setnomprofil] = useState('')
    const [rendezvousdayvisible, setrendezvousdayvisible] = useState(false);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    // Récupération du nom de l'utilisateur connecté
    useEffect(() => {
        const token = localStorage.getItem('token');
        const nomutilisateur = async () => {
            try {
                const response = await axiosInstance.get(`/utilisateurs/${idUser}`);
                if (response) {
                    setnomprofil(response.data.nom)
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des utilisateurs:', error);
            }
        }
        nomutilisateur()
    }, [idUser]);

    // Fonction pour déterminer le style selon la date
    const getEventStyle = (dateStr) => {
        const today = new Date();
        const eventDate = new Date(dateStr);
        const todayStr = today.toISOString().split('T')[0];
        
        // Réinitialiser l'heure pour la comparaison
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        if (dateStr === todayStr) {
            // Aujourd'hui (LocalDate.now()) - BLEU
            return {
                backgroundColor: '#2196F3', // Bleu professionnel
                borderColor: '#1976D2',
                textColor: '#FFFFFF', // Blanc pur pour la lisibilité
                borderWidth: '1px',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                fontWeight: 'bold'
            };
        } else if (eventDate > today) {
            // Jours suivants (futur) - VERT
            return {
                backgroundColor: '#4CAF50', // Vert professionnel
                borderColor: '#388E3C',
                textColor: '#FFFFFF', // Blanc pur pour la lisibilité
                borderWidth: '1px',
                boxShadow: '0 3px 8px rgba(76, 175, 80, 0.3)',
                fontWeight: '600'
            };
        } else {
            // Jours d'avant (passé) - ROUGE
            return {
                backgroundColor: '#F44336', // Rouge pour le passé
                borderColor: '#D32F2F',
                textColor: '#FFFFFF', // Blanc pur pour la lisibilité
                borderWidth: '1px',
                opacity: 0.9,
                fontWeight: '500'
            };
        }
    };

    // Fonction pour obtenir l'icône selon le type de rendez-vous
    const getEventIcon = (dateStr) => {
        const today = new Date();
        const eventDate = new Date(dateStr);
        const todayStr = today.toISOString().split('T')[0];
        
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        if (dateStr === todayStr) {
            return '⭐'; // Aujourd'hui - Étoile pour l'importance
        } else if (eventDate > today) {
            return '📅'; // Futur - Calendrier
        } else {
            return '⏰'; // Passé - Horloge pour le temps écoulé
        }
    };

    useEffect(() => {
        const fetchRendezvous = async () => {
            const id = localStorage.getItem('id');

            if (!id) {
                console.error('ID manquant');
                setIsLoading(false);
                return;
            }

            try {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;

                const response = await axiosInstance.get(`/rendezvous/utilisateurs/${id}/confirmed/month/${year}/${month}`);

                console.log('Réponse API complète:', response.data);
                console.log('Premier rendez-vous:', response.data[0]);
                if (response.data[0]) {
                    console.log('Structure du premier RDV:', {
                        id: response.data[0].id,
                        jour: response.data[0].jour,
                        heure: response.data[0].heure,
                        patient: response.data[0].patient,
                        patientNom: response.data[0].patient?.nom,
                        patientPrenom: response.data[0].patient?.prenom
                    });
                }

                if (response.data && Array.isArray(response.data)) {
                    // Trier les rendez-vous par ordre décroissant (plus récent en premier)
                    const rendezvousTries = response.data.sort((a, b) => {
                        // Trier d'abord par date (du plus récent au plus ancien)
                        if (a.jour && b.jour) {
                            const dateA = new Date(a.jour);
                            const dateB = new Date(b.jour);
                            if (dateA.getTime() !== dateB.getTime()) {
                                return dateB.getTime() - dateA.getTime();
                            }
                        }
                        // Si même date, trier par heure (du plus tôt au plus tard)
                        if (a.heure && b.heure) {
                            return a.heure.localeCompare(b.heure);
                        }
                        // Si pas d'heure, trier par ID (plus récent en premier)
                        return b.id - a.id;
                    });
                    
                    const dailyCounts = {};
                    const detailedEvents = [];

                    rendezvousTries.forEach(rdv => {
                        const date = rdv.jour;
                        if (date) {
                            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
                            
                            // Créer des événements détaillés avec heures pour les vues semaine/jour
                            console.log('Traitement RDV:', {
                                id: rdv.id,
                                jour: rdv.jour,
                                heure: rdv.heure,
                                patient: rdv.patient,
                                hasHeure: !!rdv.heure,
                                hasPatient: !!rdv.patient,
                                patientNom: rdv.patient?.nom,
                                patientPrenom: rdv.patient?.prenom
                            });
                            
                            // Vérifier si on a les informations nécessaires pour un événement détaillé
                            if (rdv.heure) {
                                // Essayer différentes structures possibles pour le patient
                                let patientNom = 'Patient';
                                let heure = '-' + rdv.heure;
                                
                                if (rdv.patient && typeof rdv.patient === 'object') {
                                    patientNom = rdv.patient.nom || rdv.patient.nomPatient || 'Patient';
                                } else if (rdv.nomPatient) {
                                    patientNom = rdv.nomPatient;
                                } else if (rdv.patientNomComplet) {
                                    patientNom = rdv.patientNomComplet;
                                }
                                
                                const startTime = `${date}T${rdv.heure}`;
                                const endTime = `${date}T${rdv.heure}`; // Vous pouvez ajuster la durée si nécessaire
                                
                                const style = getEventStyle(date);
                                const icon = getEventIcon(date);
                                
                                detailedEvents.push({
                                    id: rdv.id,
                                    title: `${icon} ${patientNom} ${heure}`.trim(),
                                    start: startTime,
                                    end: endTime,
                                    backgroundColor: style.backgroundColor,
                                    borderColor: style.borderColor,
                                    textColor: style.textColor,
                                    borderWidth: style.borderWidth,
                                    extendedProps: {
                                        rdvId: rdv.id,
                                        patient: { nom: patientNom, heure: heure },
                                        heure: rdv.heure,
                                        style: style,
                                        icon: icon,
                                        isDetailed: true
                                    }
                                });
                            }
                        }
                    });

                    // Événements pour la vue mois (comptage par jour)
                    const monthEvents = Object.keys(dailyCounts).map(date => {
                        const style = getEventStyle(date);
                        const icon = getEventIcon(date);
                        
                        return {
                            title: `${icon} ${dailyCounts[date]} RDV`,
                            start: date,
                            backgroundColor: style.backgroundColor,
                            borderColor: style.borderColor,
                            textColor: style.textColor,
                            borderWidth: style.borderWidth,
                            extendedProps: {
                                count: dailyCounts[date],
                                style: style,
                                icon: icon,
                                isDetailed: false
                            }
                        };
                    });

                    // Combiner les deux types d'événements
                    const allEvents = [...monthEvents, ...detailedEvents];
                    setEvents(allEvents);
                }
            } catch (err) {
                console.error('Erreur API:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRendezvous();
    }, []);



    const handleClick = (today) => {
        console.log('Date cliquée:', today.dateStr);
        navigate(`/medecin/calendrier/${today.dateStr}`);
    };

    if (isLoading) {
        return <p>Chargement du calendrier...</p>;
    }

    return (
        <>
            {/* CSS inline pour le curseur pointer et hover personnalisé */}
            <style>
                {`
                    .fc-daygrid-day {
                        cursor: pointer !important;
                    }
                    
                    /* Hover pour les jours avec rendez-vous - couleur correspondante */
                    .fc-daygrid-day.has-events:hover {
                        background-color: rgba(33, 150, 243, 0.1) !important;
                        transition: background-color 0.2s ease;
                    }
                    
                    /* Hover pour les jours sans rendez-vous */
                    .fc-daygrid-day:not(.has-events):hover {
                        background-color: rgba(158, 158, 158, 0.1) !important;
                        transition: background-color 0.2s ease;
                    }
                    
                    /* Couleur du texte des jours de la semaine */
                    .fc-col-header-cell {
                        color: #000 !important;
                        font-weight: bold !important;
                    }
                    
                    .fc-col-header-cell .fc-col-header-cell-cushion {
                        color: #000 !important;
                        font-weight: bold !important;
                    }
                    
                    /* Hover spécifique pour les événements selon leur couleur */
                    .fc-event:hover {
                        transform: scale(1.05) !important;
                        transition: all 0.2s ease !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                    }
                `}
            </style>

            <SousDiv1Style>
                <Barrehorizontal1 titrepage="Calendrier" imgprofil1={imgprofil} nomprofil={nomprofil}>
                    <Span1 onClick={() => setrendezvousdayvisible(false)}>Liste des evenements</Span1>
                </Barrehorizontal1>
            </SousDiv1Style>

            <div className='zonedaffichage' $zonedaffichagedisplay={rendezvousdayvisible ? 'none' : 'block'}
                style={{
                    height: '78vh',
                    marginRight: '30px',
                }}
            >
                <div className='numero'>
                    <div>
                    <h2 className='nomtable' style={{ marginTop: '-20px', marginBottom: '-20px' }}> Evenements </h2>
                    </div>
                </div>

                <div className='conteneurbarre'>
                    <div className='barre'></div>
                </div>

                <CalendarContainer>
                     {/* Légende des couleurs en dessous du calendrier */}
                     <div style={{
                         marginTop: '0',
                         marginBottom: '-10px',
                         padding: '1px',
                         backgroundColor: 'rgba(255, 255, 255, 0.95)',
                         borderRadius: '8px',
                         border: '2px solid #e0e0e0',
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                         display: 'flex',
                         justifyContent: 'center',
                         alignItems: 'center',
                         gap: '30px',
                         flexWrap: 'wrap'
                    }}>
                        <h4 style={{ margin: '0', color: '#333', fontSize: '14px', marginRight: '20px' }}>🎨 Légende :</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#F44336', 
                                borderRadius: '3px'
                            }}></div>
                            <span style={{ fontSize: '12px' }}>⏰ Passé</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#2196F3', 
                                borderRadius: '3px'
                            }}></div>
                            <span style={{ fontSize: '12px' }}>⭐ Aujourd'hui</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#4CAF50', 
                                borderRadius: '3px'
                            }}></div>
                            <span style={{ fontSize: '12px' }}>📅 Futur</span>
                        </div>
                    </div>

                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locales={[frLocale]}
                        locale="fr"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        buttonText={{
                            today: 'Aujourd\'hui',
                            month: 'Mois',
                            week: 'Semaine',
                            day: 'Jour'
                        }}
                        events={events}
                        height="100%"
                        dateClick={handleClick}
                        eventDisplay="block"
                        dayMaxEvents={false}
                        dayCellClassNames="clickable-day"
                        eventContent={(eventInfo) => {
                            const style = eventInfo.event.extendedProps.style;
                            const isDetailed = eventInfo.event.extendedProps.isDetailed;
                            
                            return (
                                <div 
                                    onClick={() => {
                                        // Si c'est un événement détaillé avec un ID de rendez-vous, naviguer vers les détails
                                        if (isDetailed && eventInfo.event.extendedProps.rdvId) {
                                            console.log("Navigation vers les détails du rendez-vous:", eventInfo.event.extendedProps.rdvId);
                                            navigate(`/medecin/rendezvous/viewrendezvous/${eventInfo.event.extendedProps.rdvId}`);
                                        } else {
                                            // Sinon, naviguer vers la vue du jour
                                            const dateStr = eventInfo.event.startStr.split('T')[0];
                                            navigate(`/medecin/calendrier/${dateStr}`);
                                        }
                                    }}
                                    style={{ 
                                        textAlign: 'center', 
                                        padding: isDetailed ? '6px 8px' : '4px 6px',
                                        fontSize: isDetailed ? '12px' : '11px',
                                        fontWeight: style.fontWeight || 'bold',
                                        backgroundColor: style.backgroundColor,
                                        color: style.textColor,
                                        borderRadius: '6px',
                                        margin: '2px',
                                        border: `${style.borderWidth} solid ${style.borderColor}`,
                                        boxShadow: style.boxShadow || 'none',
                                        opacity: style.opacity || 1,
                                        minHeight: isDetailed ? '24px' : '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                    title={isDetailed ? `${eventInfo.event.title} - ${eventInfo.event.extendedProps.heure}` : eventInfo.event.title}
                                >
                                    {eventInfo.event.title}
                                </div>
                            );
                        }}
                    />
                    
                   
                </CalendarContainer>
            </div>
        </>
    );
};

export default Calendar; 
