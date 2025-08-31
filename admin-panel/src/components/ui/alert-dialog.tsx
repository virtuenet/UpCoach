import React from 'react';
import * as Dialog from './dialog';

export const AlertDialog = Dialog.Dialog;
export const AlertDialogTrigger = Dialog.DialogTrigger;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof Dialog.DialogContent>,
  React.ComponentPropsWithoutRef<typeof Dialog.DialogContent>
>(({ className, ...props }, ref) => (
  <Dialog.DialogContent ref={ref} className={className} {...props} />
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Dialog.DialogHeader className={className} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Dialog.DialogFooter className={className} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.DialogTitle>,
  React.ComponentPropsWithoutRef<typeof Dialog.DialogTitle>
>(({ className, ...props }, ref) => (
  <Dialog.DialogTitle ref={ref} className={className} {...props} />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.DialogDescription>,
  React.ComponentPropsWithoutRef<typeof Dialog.DialogDescription>
>(({ className, ...props }, ref) => (
  <Dialog.DialogDescription ref={ref} className={className} {...props} />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />);
AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />);
AlertDialogCancel.displayName = 'AlertDialogCancel';
