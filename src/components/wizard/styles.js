/**
 * Wizard Component Styles
 * Shared styles for wizard UI components
 */

export const wizardStyles = {
  breadcrumbContainer: {
    marginBottom: '24px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  breadcrumbTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0'
  },
  breadcrumbStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  breadcrumbDot: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s ease'
  },
  breadcrumbDotCompleted: {
    background: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
    color: '#22c55e'
  },
  breadcrumbDotCurrent: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
    color: '#3b82f6',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)'
  },
  breadcrumbLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    minWidth: '60px'
  },
  breadcrumbLabelCurrent: {
    color: '#3b82f6'
  },
  breadcrumbLabelCompleted: {
    color: '#22c55e'
  },
  breadcrumbConnector: {
    width: '30px',
    height: '2px',
    background: 'rgba(255,255,255,0.1)',
    marginLeft: '8px',
    marginRight: '8px'
  },
  breadcrumbConnectorCompleted: {
    background: '#22c55e'
  }
};

export const collapsibleStyles = {
  container: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease'
  },
  header: {
    width: '100%',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '20px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff'
  },
  badge: {
    padding: '4px 12px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: '500'
  },
  tooltipTrigger: {
    fontSize: '14px',
    color: '#666',
    cursor: 'help',
    marginLeft: '4px'
  },
  chevron: {
    fontSize: '10px',
    color: '#666',
    transition: 'transform 0.2s ease'
  },
  content: {
    padding: '4px 24px 24px 24px'
  }
};

export const tooltipStyles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center'
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 12px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#fff',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginBottom: '8px'
  },
  arrow: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid rgba(255,255,255,0.15)'
  }
};

export const whatYouGetStyles = {
  container: {
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    marginBottom: '20px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
    margin: '0 0 16px 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#ccc'
  },
  itemIcon: {
    fontSize: '16px'
  },
  itemLabel: {
    color: '#fff'
  },
  pageList: {
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  pageListLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
    display: 'block'
  },
  pageChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  pageChip: {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#fff'
  }
};

export const industryBannerStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(34, 197, 94, 0.25)',
    marginBottom: '20px'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '24px'
  },
  info: {
    display: 'flex',
    flexDirection: 'column'
  },
  detected: {
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  name: {
    fontSize: '15px',
    color: '#fff',
    fontWeight: '600'
  },
  changeBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};
