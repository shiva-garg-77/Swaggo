import { Container } from 'inversify';
import 'reflect-metadata';

// Import services
import ChatService from '../Services/Chat/ChatService.js';
import MessageService from '../Services/Messaging/MessageService.js';
import UserService from '../Services/User/UserService.js';
import AuthService from '../Services/Authentication/AuthService.js';
import FileService from '../Services/Storage/FileService.js';
import EventBus from '../Services/CQRS/EventBus.js';
import SystemMonitoringService from '../Services/System/SystemMonitoringService.js';
import APIGatewayService from '../Services/System/APIGatewayService.js';

// Import repositories
import ChatRepository from '../Repositories/ChatRepository.js';
import MessageRepository from '../Repositories/MessageRepository.js';
import ProfileRepository from '../Repositories/ProfileRepository.js';

// Import controllers
import SocketConnectionService from '../Services/Chat/SocketConnectionService.js';
import SocketMessagingService from '../Services/Messaging/SocketMessagingService.js';
import SocketCallService from '../Services/Chat/SocketCallService.js';
import SocketRoomService from '../Services/Chat/SocketRoomService.js';

// Define service identifiers
const TYPES = {
  // Services
  ChatService: Symbol.for('ChatService'),
  MessageService: Symbol.for('MessageService'),
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  FileService: Symbol.for('FileService'),
  EventBus: Symbol.for('EventBus'),
  SystemMonitoringService: Symbol.for('SystemMonitoringService'),
  APIGatewayService: Symbol.for('APIGatewayService'),
  
  // Repositories
  ChatRepository: Symbol.for('ChatRepository'),
  MessageRepository: Symbol.for('MessageRepository'),
  ProfileRepository: Symbol.for('ProfileRepository'),
  
  // Socket Services
  SocketConnectionService: Symbol.for('SocketConnectionService'),
  SocketMessagingService: Symbol.for('SocketMessagingService'),
  SocketCallService: Symbol.for('SocketCallService'),
  SocketRoomService: Symbol.for('SocketRoomService')
};

// Create container
const container = new Container();

// Bind repositories
container.bind(TYPES.ChatRepository).to(ChatRepository).inSingletonScope();
container.bind(TYPES.MessageRepository).to(MessageRepository).inSingletonScope();
container.bind(TYPES.ProfileRepository).to(ProfileRepository).inSingletonScope();

// Bind services
container.bind(TYPES.ChatService).to(ChatService).inSingletonScope()
  .onActivation((context, chatService) => {
    chatService.chatRepository = context.get(TYPES.ChatRepository);
    chatService.messageRepository = context.get(TYPES.MessageRepository);
    chatService.profileRepository = context.get(TYPES.ProfileRepository);
    return chatService;
  });
container.bind(TYPES.MessageService).to(MessageService).inSingletonScope()
  .onActivation((context, messageService) => {
    messageService.messageRepository = context.get(TYPES.MessageRepository);
    messageService.chatRepository = context.get(TYPES.ChatRepository);
    messageService.profileRepository = context.get(TYPES.ProfileRepository);
    return messageService;
  });
container.bind(TYPES.UserService).to(UserService).inSingletonScope()
  .onActivation((context, userService) => {
    userService.profileRepository = context.get(TYPES.ProfileRepository);
    return userService;
  });
container.bind(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind(TYPES.FileService).to(FileService).inSingletonScope();
container.bind(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind(TYPES.SystemMonitoringService).to(SystemMonitoringService).inSingletonScope()
  .onActivation((context, systemMonitoringService) => {
    systemMonitoringService.eventBus = context.get(TYPES.EventBus);
    systemMonitoringService.subscribeToEvents();
    return systemMonitoringService;
  });
container.bind(TYPES.APIGatewayService).to(APIGatewayService).inSingletonScope();

// Bind socket services
container.bind(TYPES.SocketConnectionService).to(SocketConnectionService).inSingletonScope()
  .onActivation((context, socketConnectionService) => {
    socketConnectionService.eventBus = context.get(TYPES.EventBus);
    socketConnectionService.initializeCleanupSystems();
    return socketConnectionService;
  });
container.bind(TYPES.SocketMessagingService).to(SocketMessagingService).inSingletonScope()
  .onActivation((context, socketMessagingService) => {
    socketMessagingService.messageService = context.get(TYPES.MessageService);
    socketMessagingService.eventBus = context.get(TYPES.EventBus);
    socketMessagingService.initializeCleanupSystems();
    return socketMessagingService;
  });
container.bind(TYPES.SocketCallService).to(SocketCallService).inSingletonScope()
  .onActivation((context, socketCallService) => {
    socketCallService.eventBus = context.get(TYPES.EventBus);
    socketCallService.initializeCleanupSystems();
    return socketCallService;
  });
container.bind(TYPES.SocketRoomService).to(SocketRoomService).inSingletonScope()
  .onActivation((context, socketRoomService) => {
    socketRoomService.chatService = context.get(TYPES.ChatService);
    socketRoomService.eventBus = context.get(TYPES.EventBus);
    socketRoomService.initializeCleanupSystems();
    return socketRoomService;
  });

export { container, TYPES };