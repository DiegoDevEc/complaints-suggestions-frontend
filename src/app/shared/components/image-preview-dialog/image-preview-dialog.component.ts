import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
    selector: 'app-image-preview-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex items-center justify-center p-4">
            <img [src]="imageUrl" [alt]="originalName || 'Imagen'" class="max-w-full max-h-[80vh] object-contain" />
        </div>
    `
})
export class ImagePreviewDialogComponent {
    imageUrl: string;
    originalName?: string;

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig
    ) {
        this.imageUrl = this.config.data?.imageUrl;
        this.originalName = this.config.data?.originalName;
    }
}
