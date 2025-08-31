/**
 * UpCoach Design System - Effects Tokens
 * Shadows, borders, and other visual effects
 */
export declare const shadows: {
  readonly none: 'none';
  readonly xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
  readonly sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
  readonly md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
  readonly lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
  readonly xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
  readonly '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  readonly inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)';
  readonly card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
  readonly dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
  readonly modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  readonly button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
  readonly buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
  readonly primary: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.1)';
  readonly success: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -4px rgba(16, 185, 129, 0.1)';
  readonly error: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)';
};
export declare const borders: {
  readonly width: {
    readonly none: '0';
    readonly thin: '1px';
    readonly medium: '2px';
    readonly thick: '4px';
  };
  readonly style: {
    readonly none: 'none';
    readonly solid: 'solid';
    readonly dashed: 'dashed';
    readonly dotted: 'dotted';
  };
  readonly radius: {
    readonly none: '0';
    readonly sm: '0.125rem';
    readonly md: '0.25rem';
    readonly lg: '0.5rem';
    readonly xl: '0.75rem';
    readonly '2xl': '1rem';
    readonly '3xl': '1.5rem';
    readonly full: '9999px';
    readonly circle: '50%';
  };
};
export declare const transitions: {
  readonly duration: {
    readonly instant: '0ms';
    readonly fast: '150ms';
    readonly base: '250ms';
    readonly slow: '350ms';
    readonly slower: '500ms';
    readonly slowest: '750ms';
  };
  readonly timing: {
    readonly linear: 'linear';
    readonly ease: 'ease';
    readonly easeIn: 'cubic-bezier(0.4, 0, 1, 1)';
    readonly easeOut: 'cubic-bezier(0, 0, 0.2, 1)';
    readonly easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)';
    readonly bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    readonly sharp: 'cubic-bezier(0.4, 0, 0.6, 1)';
  };
  readonly all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  readonly colors: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  readonly opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  readonly shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  readonly transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)';
};
export declare const animation: {
  readonly keyframes: {
    readonly fadeIn: {
      readonly from: {
        readonly opacity: 0;
      };
      readonly to: {
        readonly opacity: 1;
      };
    };
    readonly fadeOut: {
      readonly from: {
        readonly opacity: 1;
      };
      readonly to: {
        readonly opacity: 0;
      };
    };
    readonly slideUp: {
      readonly from: {
        readonly transform: 'translateY(100%)';
        readonly opacity: 0;
      };
      readonly to: {
        readonly transform: 'translateY(0)';
        readonly opacity: 1;
      };
    };
    readonly slideDown: {
      readonly from: {
        readonly transform: 'translateY(-100%)';
        readonly opacity: 0;
      };
      readonly to: {
        readonly transform: 'translateY(0)';
        readonly opacity: 1;
      };
    };
    readonly slideLeft: {
      readonly from: {
        readonly transform: 'translateX(100%)';
        readonly opacity: 0;
      };
      readonly to: {
        readonly transform: 'translateX(0)';
        readonly opacity: 1;
      };
    };
    readonly slideRight: {
      readonly from: {
        readonly transform: 'translateX(-100%)';
        readonly opacity: 0;
      };
      readonly to: {
        readonly transform: 'translateX(0)';
        readonly opacity: 1;
      };
    };
    readonly scaleIn: {
      readonly from: {
        readonly transform: 'scale(0.95)';
        readonly opacity: 0;
      };
      readonly to: {
        readonly transform: 'scale(1)';
        readonly opacity: 1;
      };
    };
    readonly scaleOut: {
      readonly from: {
        readonly transform: 'scale(1)';
        readonly opacity: 1;
      };
      readonly to: {
        readonly transform: 'scale(0.95)';
        readonly opacity: 0;
      };
    };
    readonly spin: {
      readonly from: {
        readonly transform: 'rotate(0deg)';
      };
      readonly to: {
        readonly transform: 'rotate(360deg)';
      };
    };
    readonly pulse: {
      readonly '0%, 100%': {
        readonly opacity: 1;
      };
      readonly '50%': {
        readonly opacity: 0.5;
      };
    };
    readonly bounce: {
      readonly '0%, 100%': {
        readonly transform: 'translateY(0)';
      };
      readonly '50%': {
        readonly transform: 'translateY(-25%)';
      };
    };
    readonly shimmer: {
      readonly from: {
        readonly backgroundPosition: '-200% 0';
      };
      readonly to: {
        readonly backgroundPosition: '200% 0';
      };
    };
  };
  readonly presets: {
    readonly fadeIn: 'fadeIn 250ms ease-out';
    readonly fadeOut: 'fadeOut 250ms ease-out';
    readonly slideUp: 'slideUp 350ms cubic-bezier(0, 0, 0.2, 1)';
    readonly slideDown: 'slideDown 350ms cubic-bezier(0, 0, 0.2, 1)';
    readonly scaleIn: 'scaleIn 250ms cubic-bezier(0, 0, 0.2, 1)';
    readonly scaleOut: 'scaleOut 250ms cubic-bezier(0, 0, 0.2, 1)';
    readonly spin: 'spin 1s linear infinite';
    readonly pulse: 'pulse 2s ease-in-out infinite';
    readonly bounce: 'bounce 1s ease-in-out infinite';
    readonly shimmer: 'shimmer 2s linear infinite';
  };
};
export declare const blur: {
  readonly none: '0';
  readonly sm: '4px';
  readonly md: '8px';
  readonly lg: '12px';
  readonly xl: '16px';
  readonly '2xl': '24px';
  readonly '3xl': '40px';
};
export declare const opacity: {
  readonly 0: '0';
  readonly 5: '0.05';
  readonly 10: '0.1';
  readonly 20: '0.2';
  readonly 25: '0.25';
  readonly 30: '0.3';
  readonly 40: '0.4';
  readonly 50: '0.5';
  readonly 60: '0.6';
  readonly 70: '0.7';
  readonly 75: '0.75';
  readonly 80: '0.8';
  readonly 90: '0.9';
  readonly 95: '0.95';
  readonly 100: '1';
};
export declare const zIndex: {
  readonly hide: -1;
  readonly auto: 'auto';
  readonly base: 0;
  readonly docked: 10;
  readonly dropdown: 1000;
  readonly sticky: 1100;
  readonly banner: 1200;
  readonly overlay: 1300;
  readonly modal: 1400;
  readonly popover: 1500;
  readonly skipLink: 1600;
  readonly toast: 1700;
  readonly tooltip: 1800;
};
declare const _default: {
  shadows: {
    readonly none: 'none';
    readonly xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    readonly sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
    readonly md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
    readonly lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
    readonly xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
    readonly '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    readonly inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)';
    readonly card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
    readonly dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
    readonly modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    readonly button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    readonly buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
    readonly primary: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.1)';
    readonly success: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -4px rgba(16, 185, 129, 0.1)';
    readonly error: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)';
  };
  borders: {
    readonly width: {
      readonly none: '0';
      readonly thin: '1px';
      readonly medium: '2px';
      readonly thick: '4px';
    };
    readonly style: {
      readonly none: 'none';
      readonly solid: 'solid';
      readonly dashed: 'dashed';
      readonly dotted: 'dotted';
    };
    readonly radius: {
      readonly none: '0';
      readonly sm: '0.125rem';
      readonly md: '0.25rem';
      readonly lg: '0.5rem';
      readonly xl: '0.75rem';
      readonly '2xl': '1rem';
      readonly '3xl': '1.5rem';
      readonly full: '9999px';
      readonly circle: '50%';
    };
  };
  transitions: {
    readonly duration: {
      readonly instant: '0ms';
      readonly fast: '150ms';
      readonly base: '250ms';
      readonly slow: '350ms';
      readonly slower: '500ms';
      readonly slowest: '750ms';
    };
    readonly timing: {
      readonly linear: 'linear';
      readonly ease: 'ease';
      readonly easeIn: 'cubic-bezier(0.4, 0, 1, 1)';
      readonly easeOut: 'cubic-bezier(0, 0, 0.2, 1)';
      readonly easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)';
      readonly bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      readonly sharp: 'cubic-bezier(0.4, 0, 0.6, 1)';
    };
    readonly all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    readonly colors: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    readonly opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    readonly shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    readonly transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  };
  animation: {
    readonly keyframes: {
      readonly fadeIn: {
        readonly from: {
          readonly opacity: 0;
        };
        readonly to: {
          readonly opacity: 1;
        };
      };
      readonly fadeOut: {
        readonly from: {
          readonly opacity: 1;
        };
        readonly to: {
          readonly opacity: 0;
        };
      };
      readonly slideUp: {
        readonly from: {
          readonly transform: 'translateY(100%)';
          readonly opacity: 0;
        };
        readonly to: {
          readonly transform: 'translateY(0)';
          readonly opacity: 1;
        };
      };
      readonly slideDown: {
        readonly from: {
          readonly transform: 'translateY(-100%)';
          readonly opacity: 0;
        };
        readonly to: {
          readonly transform: 'translateY(0)';
          readonly opacity: 1;
        };
      };
      readonly slideLeft: {
        readonly from: {
          readonly transform: 'translateX(100%)';
          readonly opacity: 0;
        };
        readonly to: {
          readonly transform: 'translateX(0)';
          readonly opacity: 1;
        };
      };
      readonly slideRight: {
        readonly from: {
          readonly transform: 'translateX(-100%)';
          readonly opacity: 0;
        };
        readonly to: {
          readonly transform: 'translateX(0)';
          readonly opacity: 1;
        };
      };
      readonly scaleIn: {
        readonly from: {
          readonly transform: 'scale(0.95)';
          readonly opacity: 0;
        };
        readonly to: {
          readonly transform: 'scale(1)';
          readonly opacity: 1;
        };
      };
      readonly scaleOut: {
        readonly from: {
          readonly transform: 'scale(1)';
          readonly opacity: 1;
        };
        readonly to: {
          readonly transform: 'scale(0.95)';
          readonly opacity: 0;
        };
      };
      readonly spin: {
        readonly from: {
          readonly transform: 'rotate(0deg)';
        };
        readonly to: {
          readonly transform: 'rotate(360deg)';
        };
      };
      readonly pulse: {
        readonly '0%, 100%': {
          readonly opacity: 1;
        };
        readonly '50%': {
          readonly opacity: 0.5;
        };
      };
      readonly bounce: {
        readonly '0%, 100%': {
          readonly transform: 'translateY(0)';
        };
        readonly '50%': {
          readonly transform: 'translateY(-25%)';
        };
      };
      readonly shimmer: {
        readonly from: {
          readonly backgroundPosition: '-200% 0';
        };
        readonly to: {
          readonly backgroundPosition: '200% 0';
        };
      };
    };
    readonly presets: {
      readonly fadeIn: 'fadeIn 250ms ease-out';
      readonly fadeOut: 'fadeOut 250ms ease-out';
      readonly slideUp: 'slideUp 350ms cubic-bezier(0, 0, 0.2, 1)';
      readonly slideDown: 'slideDown 350ms cubic-bezier(0, 0, 0.2, 1)';
      readonly scaleIn: 'scaleIn 250ms cubic-bezier(0, 0, 0.2, 1)';
      readonly scaleOut: 'scaleOut 250ms cubic-bezier(0, 0, 0.2, 1)';
      readonly spin: 'spin 1s linear infinite';
      readonly pulse: 'pulse 2s ease-in-out infinite';
      readonly bounce: 'bounce 1s ease-in-out infinite';
      readonly shimmer: 'shimmer 2s linear infinite';
    };
  };
  blur: {
    readonly none: '0';
    readonly sm: '4px';
    readonly md: '8px';
    readonly lg: '12px';
    readonly xl: '16px';
    readonly '2xl': '24px';
    readonly '3xl': '40px';
  };
  opacity: {
    readonly 0: '0';
    readonly 5: '0.05';
    readonly 10: '0.1';
    readonly 20: '0.2';
    readonly 25: '0.25';
    readonly 30: '0.3';
    readonly 40: '0.4';
    readonly 50: '0.5';
    readonly 60: '0.6';
    readonly 70: '0.7';
    readonly 75: '0.75';
    readonly 80: '0.8';
    readonly 90: '0.9';
    readonly 95: '0.95';
    readonly 100: '1';
  };
  zIndex: {
    readonly hide: -1;
    readonly auto: 'auto';
    readonly base: 0;
    readonly docked: 10;
    readonly dropdown: 1000;
    readonly sticky: 1100;
    readonly banner: 1200;
    readonly overlay: 1300;
    readonly modal: 1400;
    readonly popover: 1500;
    readonly skipLink: 1600;
    readonly toast: 1700;
    readonly tooltip: 1800;
  };
};
export default _default;
//# sourceMappingURL=effects.d.ts.map
