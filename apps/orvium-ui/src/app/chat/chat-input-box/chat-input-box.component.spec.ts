import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatInputBoxComponent } from './chat-input-box.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DefaultService } from '@orvium/api';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

describe('ChatInputBoxComponent', () => {
  let component: ChatInputBoxComponent;
  let fixture: ComponentFixture<ChatInputBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInputBoxComponent, HttpClientTestingModule],
      providers: [
        MockProvider(DefaultService, {
          addMessage: jest.fn().mockReturnValue(of({})),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send message', () => {
    component.message.setValue('example message');
    component.sendMessage();
    expect(component.message.value).toBe('<p></p>');
  });
});
